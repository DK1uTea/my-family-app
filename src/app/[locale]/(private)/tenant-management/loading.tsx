import { Skeleton } from '@/shared/components/ui/skeleton';

export default function TenantManagementLoading() {
  return <div className="space-y-5"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-full" /><Skeleton className="h-72 w-full" /></div>;
}
