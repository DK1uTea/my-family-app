'use client';

import { usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

type ParamValue = string | number | boolean | null | undefined;

type UpdateUrlParamsOptions = {
  /**
   * true     → keep every other existing param, only merge/overwrite the given keys
   * string[] → keep only the listed params (plus the ones being set)
   * false (default) → clear all other params
   */
  keepParams?: boolean | string[];
};

/**
 * Generic multi-key URL param updater. `useQueryState`/`useQueryStates` need a
 * statically-known key shape, which doesn't fit a "set any params" hook — so this
 * builds the query string manually and applies it via `window.history.replaceState`,
 * the same shallow-routing technique nuqs uses internally (see TabsUrl's manual
 * branches). No Next.js navigation is triggered, so Server Components never refetch,
 * and `replaceState` (not `pushState`) avoids piling up back-button history entries.
 */
export function useUpdateUrlParams() {
  const locale = useLocale();
  const pathname = usePathname();

  return function updateParamsUrl(
    params: Record<string, ParamValue>,
    options: UpdateUrlParamsOptions = {},
  ) {
    const { keepParams = false } = options;
    const current = new URLSearchParams(window.location.search);
    const next = new URLSearchParams();

    if (keepParams === true) {
      current.forEach((value, key) => next.set(key, value));
    } else if (Array.isArray(keepParams)) {
      for (const key of keepParams) {
        const value = current.get(key);
        if (value !== null) next.set(key, value);
      }
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }

    const search = next.toString() ? `?${next.toString()}` : '';
    const url = `${locale ? `/${locale}` : ''}${pathname}${search}`;

    window.history.replaceState({}, '', url);
  };
}
