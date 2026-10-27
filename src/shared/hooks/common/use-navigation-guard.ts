'use client';

import { useEffect, useRef } from 'react';

// ── Module-level registry — set up once on first hook mount ────────────────
// Shared by every useNavigationGuard consumer on the page (e.g. the sidebar's
// order-reactivate guard AND every step's useUnsavedChanges guard, mounted
// simultaneously). Guards are tracked in a stack rather than a single
// variable: an unconditional "cleanup nulls the shared blocker" would let one
// guard's deactivation (e.g. a step's isDirty flipping false after an
// unrelated refetch) silently wipe out a DIFFERENT, still-active guard's
// registration. Each guard's cleanup only removes its own entry.
type Blocker = (proceed: () => void) => void;
// `blocksInternalNav: true` guards (e.g. a dirty step's unsaved-changes
// prompt) intercept same-page step navigation (sidebar step clicks) as well
// as real cross-page navigation. `blocksInternalNav: false` guards (the
// order-reactivate / cart-changed dialogs) only make sense when the user is
// actually leaving the event-form flow — clicking between wizard steps of
// the SAME event must never trigger them, so they are excluded from the
// stack `requestGuardedNavigation` (called directly by step clicks) checks.
type BlockerEntry = { fn: Blocker; blocksInternalNav: boolean };
let _originalPushState: (typeof history)['pushState'] | null = null;
let _blockers: BlockerEntry[] = [];
let _formUrl = '';
let _ignoreNextPopstate = false;
let _isSetup = false;

function currentBlocker(): Blocker | null {
  return _blockers.length > 0 ? _blockers[_blockers.length - 1].fn : null;
}

function currentInternalBlocker(): Blocker | null {
  for (let i = _blockers.length - 1; i >= 0; i -= 1) {
    if (_blockers[i].blocksInternalNav) return _blockers[i].fn;
  }
  return null;
}

export function requestGuardedNavigation(proceed: () => void) {
  const blocker = currentInternalBlocker();
  if (blocker) {
    blocker(proceed);
    return;
  }

  proceed();
}

function isCrossPage(href: string): boolean {
  try {
    const target = new URL(href, window.location.href);
    return (
      target.origin === window.location.origin &&
      target.pathname !== window.location.pathname
    );
  } catch {
    return false;
  }
}

function setup() {
  if (typeof window === 'undefined' || _isSetup) return;
  _isSetup = true;

  // Keep the original pushState reference for URL restoration in the popstate handler.
  // We also wrap it to track _formUrl on same-page nuqs/router param updates.
  // Crucially: no React state calls here → no useInsertionEffect violations.
  _originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = function (
    state: Parameters<History['pushState']>[0],
    title: string,
    url?: string | URL | null,
  ) {
    _originalPushState!(state, title, url);
    if (currentBlocker() && url && !isCrossPage(url.toString())) {
      _formUrl = window.location.href;
    }
  };

  // ── Click interceptor ───────────────────────────────────────────────────
  // Intercept anchor clicks BEFORE Next.js App Router processes them.
  document.addEventListener(
    'click',
    (e) => {
      const blocker = currentBlocker();
      if (!blocker) return;
      const anchor = (e.composedPath() as EventTarget[]).find(
        (el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement,
      );
      if (!anchor || anchor.target === '_blank') return;
      const href = anchor.getAttribute('href') ?? '';
      if (!isCrossPage(href)) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      // After user confirms, re-click the same anchor.
      blocker(() => anchor.click());
    },
    { capture: true },
  );

  // ── Popstate interceptor ────────────────────────────────────────────────
  // Capture phase runs before Next.js router.
  window.addEventListener(
    'popstate',
    (e) => {
      if (_ignoreNextPopstate) {
        _ignoreNextPopstate = false;
        return;
      }
      const blocker = currentBlocker();
      if (!blocker) return;

      // Same-page navigation (step change via nuqs back/forward) — update
      // _formUrl so future cross-page blocks restore the right URL, then allow.
      try {
        const currentPath = new URL(window.location.href).pathname;
        const formPath = new URL(_formUrl).pathname;
        if (currentPath === formPath) {
          _formUrl = window.location.href;
          return;
        }
      } catch { /* ignore */ }

      // Cross-page — block Next.js from processing this event.
      e.stopImmediatePropagation();
      // Restore the form URL in the address bar (does not re-trigger popstate).
      _originalPushState!(null, '', _formUrl);
      blocker(() => {
        _ignoreNextPopstate = true;
        window.history.go(-1);
      });
    },
    { capture: true },
  );
}
// ──────────────────────────────────────────────────────────────────────────

/**
 * Intercepts cross-page navigation (anchor clicks, back/forward, browser close)
 * while `active` is true, handing control to `onIntercepted` instead of letting
 * the navigation proceed. `onIntercepted` receives a `proceed` callback that
 * replays the original navigation once the caller is done (e.g. after a
 * confirm dialog).
 */
export function useNavigationGuard(
  active: boolean,
  onIntercepted: (proceed: () => void) => void,
  options?: { blocksInternalNav?: boolean },
) {
  const interceptedRef = useRef(onIntercepted);
  interceptedRef.current = onIntercepted;
  const blocksInternalNav = options?.blocksInternalNav ?? true;

  useEffect(() => {
    setup();
  }, []);

  useEffect(() => {
    if (!active) return;

    _formUrl = window.location.href;
    const entry: BlockerEntry = {
      fn: (proceed) => interceptedRef.current(proceed),
      blocksInternalNav,
    };
    _blockers.push(entry);

    return () => {
      _blockers = _blockers.filter((b) => b !== entry);
    };
  }, [active, blocksInternalNav]);

  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [active]);
}
