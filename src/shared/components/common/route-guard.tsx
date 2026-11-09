'use client';

import { ForbiddenView } from '@/shared/components/common/forbidden-view';
import { useHasPermission } from '@/shared/stores/use-user-store';

type Props = {
  requiredKeys: string | string[];
  children: React.ReactNode;
};

export function RouteGuard({ requiredKeys, children }: Props) {
  const allowed = useHasPermission(requiredKeys);
  return allowed ? <>{children}</> : <ForbiddenView />;
}
