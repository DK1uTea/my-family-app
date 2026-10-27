'use client';

import { QueryClient } from '@tanstack/react-query';
import { QueryCache } from '@tanstack/react-query';
import { getErrorStatus, isMaintenanceStatus } from '@/lib/get-error-status';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1, // retry up to 2 times
        refetchOnWindowFocus: false, // do not refetch when switching tabs
        refetchOnReconnect: true, // refetch when reconnecting to the network
        staleTime: 1000 * 60, // 1 minute -> consider data "fresh"
        // A module-level API outage (>=400, excluding 401/403) rethrows to the
        // module's error.tsx boundary instead of leaving the query silently errored —
        // that boundary only replaces the page content, so the sidebar stays usable.
        throwOnError: (error: unknown) => isMaintenanceStatus(getErrorStatus(error)),
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
      console.error(`❌ Error in query [${query.queryHash}]:`, error);
      },
    }),
  });
}
