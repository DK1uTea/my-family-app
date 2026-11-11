import { TenantManagementMain } from '@/features/tenant-management/(components)/tenant-management-main';
import { RouteGuard } from '@/shared/components/common/route-guard';
import { PermissionKey } from '@/shared/constants/permissions';

export default function TenantManagementPage() {
  return (
    <RouteGuard requiredKeys={PermissionKey.TenantManagement.Read}>
      <TenantManagementMain />
    </RouteGuard>
  );
}
