import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useNavigationGuard } from '@/shared/hooks/common/use-navigation-guard';

/**
 * Reproduces a real bug: the event-form page mounts TWO independent
 * useNavigationGuard consumers at once — the sidebar's order-cancel/reactivate
 * guard, and every step's useUnsavedChanges guard. When they shared a single
 * `_blocker` variable, one guard deactivating (e.g. a step's `isDirty`
 * flipping false after an unrelated refetch) unconditionally nulled that
 * variable in its cleanup — silently un-registering a DIFFERENT guard that
 * was still active, so leaving the page was no longer blocked at all.
 */
function OtherGuard({ active }: { active: boolean }) {
  useNavigationGuard(active, () => {
    // This guard never actually intercepts in this test — it only exists to
    // register/unregister itself and prove it doesn't clobber the sibling.
  });
  return null;
}

function MainGuard({ onInterceptedCountChange }: { onInterceptedCountChange: (n: number) => void }) {
  const countRef = { current: 0 } as { current: number };
  useNavigationGuard(true, () => {
    countRef.current += 1;
    onInterceptedCountChange(countRef.current);
  });
  return <a href="/other-page" data-testid="link">link</a>;
}

describe('useNavigationGuard — multiple simultaneous consumers', () => {
  it('keeps blocking navigation for a still-active guard when a sibling guard deactivates', () => {
    let interceptedCount = 0;

    function Harness() {
      const [otherActive, setOtherActive] = useState(true);
      return (
        <div>
          <OtherGuard active={otherActive} />
          <MainGuard onInterceptedCountChange={(n) => { interceptedCount = n; }} />
          <button data-testid="deactivate-other" onClick={() => setOtherActive(false)}>
            deactivate other
          </button>
        </div>
      );
    }

    render(<Harness />);

    // The sibling guard deactivates (e.g. a step's form becomes pristine
    // again after an unrelated refetch) — this must NOT affect MainGuard,
    // which is still active.
    act(() => {
      fireEvent.click(screen.getByTestId('deactivate-other'));
    });

    fireEvent.click(screen.getByTestId('link'));

    expect(interceptedCount).toBe(1);
  });
});
