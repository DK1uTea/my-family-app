import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar';
import { AppFooter } from '@/shared/components/common/layout/app-footer';
import { AppSidebar } from '@/shared/components/common/layout/app-sidebar';
import { AppHeader } from '@/shared/components/common/layout/app-header';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background min-w-0 min-h-screen">
        <AppHeader />
        <div className="p-6 flex-1">{children}</div>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
