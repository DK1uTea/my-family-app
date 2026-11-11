import { requireRoles } from '@/app/api/_shared/require-roles'
import { UserRole } from '@/server/modules/roles'
import { tenantsController } from '../../tenants.controller'

export const PATCH = requireRoles([UserRole.SUPER_ADMIN])(
  tenantsController.activate,
)
