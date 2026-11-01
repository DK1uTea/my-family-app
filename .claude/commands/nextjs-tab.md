# Tab Navigation

URL-synced tabs via nuqs `useQueryState` by default. Use `TabsUrl` for all tabs. Set `syncUrl={false}` for drawers/dialogs.

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TabsUrl` | `@/shared/components/ui/tabs-url` | nuqs-backed wrapper — use for all tabs |
| `TabsList`, `TabsTrigger`, `TabsContent` | `@/shared/components/ui/tabs` | Tab parts |

## TabsUrl Props

| Prop | Default | Description |
|------|---------|-------------|
| `defaultValue` | required | First tab (absent from URL when active = clean URLs) |
| `paramName` | `"tab"` | nuqs URL param key |
| `syncUrl` | `true` | `false` = local state only (drawers, dialogs) |

## Page-level Tabs (URL-synced)

```tsx
'use client';
import { TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { TabsUrl } from '@/shared/components/ui/tabs-url';
import { useTranslations } from 'next-intl';

export function UserDetailMain() {
  const t = useTranslations('users');
  return (
    <TabsUrl defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">{t('detail.tabOverview')}</TabsTrigger>
        <TabsTrigger value="history">{t('detail.tabHistory')}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">...</TabsContent>
      <TabsContent value="history">...</TabsContent>
    </TabsUrl>
  );
}
```

## Drawer/Dialog Tabs (local state)

```tsx
<TabsUrl defaultValue="info" syncUrl={false}>
  <TabsList>
    <TabsTrigger value="info">Info</TabsTrigger>
    <TabsTrigger value="logs">Logs</TabsTrigger>
  </TabsList>
  <TabsContent value="info">...</TabsContent>
  <TabsContent value="logs">...</TabsContent>
</TabsUrl>
```

## Multiple tab groups — avoid collisions

```tsx
<TabsUrl defaultValue="overview" paramName="mainTab">...</TabsUrl>
<TabsUrl defaultValue="monthly" paramName="chartTab">...</TabsUrl>
```

## Rules

- ✅ `defaultValue` = first tab in the list
- ✅ `syncUrl={false}` for drawers, dialogs, embedded panels
- ✅ `variant="line"` for page navigation tabs
- ✅ Translate labels via `useTranslations`; add to both `en.json` and `vi.json`
- ❌ Never `useState` for active tab — use `TabsUrl`
- ❌ Never add `value` or `onValueChange` to `TabsUrl`
