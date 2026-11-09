import { cookies } from 'next/headers';
import { EventTimelineMain } from '@/features/event-timeline/(components)/event-timeline-main';
import { ForbiddenView } from '@/shared/components/common/forbidden-view';
import { RouteGuard } from '@/shared/components/common/route-guard';
import { verifyAccessToken } from '@/server/modules/auth';
import { rolesService, ServerModuleKey } from '@/server/modules/roles';
import { PermissionKey } from '@/shared/constants/permissions';

export default async function EventTimelinePage() {
  const token = (await cookies()).get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  const allowed = payload?.sub
    ? await rolesService.canAccess(payload.sub, ServerModuleKey.EventTimeline)
    : false;

  if (!allowed) return <ForbiddenView />;
  return (
    <RouteGuard requiredKeys={PermissionKey.EventTimeline.Read}>
      <EventTimelineMain />
    </RouteGuard>
  );
}
