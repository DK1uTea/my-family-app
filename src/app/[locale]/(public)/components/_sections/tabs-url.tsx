'use client';

import { TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { TabsUrl } from '@/shared/components/ui/tabs-url';

export function TabsUrlSection() {
  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">TabsUrl</h2>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">URL-synced — variant line (page-level)</p>
        <TabsUrl defaultValue="overview" paramName="demoTab">
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-muted-foreground">Overview content — default tab, absent from URL.</p>
          </TabsContent>
          <TabsContent value="history">
            <p className="text-sm text-muted-foreground">History content — URL shows <code className="text-xs">?demoTab=history</code>.</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-sm text-muted-foreground">Settings content — URL shows <code className="text-xs">?demoTab=settings</code>.</p>
          </TabsContent>
        </TabsUrl>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Local state only — syncUrl=false (drawer/dialog)</p>
        <TabsUrl defaultValue="info" syncUrl={false}>
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <p className="text-sm text-muted-foreground">Info content — no URL change on switch.</p>
          </TabsContent>
          <TabsContent value="logs">
            <p className="text-sm text-muted-foreground">Logs content — no URL change on switch.</p>
          </TabsContent>
        </TabsUrl>
      </div>
    </section>
  );
}
