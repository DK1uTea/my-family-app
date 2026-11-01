---
name: nextjs-new-module
description: End-to-end recipe for adding a brand-new top-level module (a new sidebar entry with its own icon, route, feature folder, and optional permission gate). MUST be read before creating any new module — covers app-sidebar.tsx registration, icon creation, permissions.ts wiring, RouteGuard usage, and the feature/page scaffold, in the exact order that keeps the app buildable at every step. Triggers on "new module", "add a module", "new sidebar item/entry", "create a new top-level feature", "add page to sidebar".
user-invocable: true
---

# New Module (sidebar-level feature)

A "module" = a new item in the left sidebar (`app-sidebar.tsx`) with its own icon, its own route under `src/app/[locale]/(private)/`, its own `src/features/<module-name>/` folder, and — if it's role-gated — a permission key checked via `RouteGuard`. This is a superset of plain feature scaffolding (`nextjs-feature` skill): do this first, then use `nextjs-feature` conventions for the feature folder internals.

Reference implementation to diff against: **`reporting-tool`** (permission-gated module) and **`customer-activation`** (simpler page/loading/error trio). Read those before improvising.

## Step 0 — Decide: does this module need a permission check?

- If **any** authenticated user should see it → `alwaysShow: true` in the sidebar, **no** `RouteGuard`. (e.g. `dashboards`, `user-settings`)
- If it's gated by backend-assigned role/navbar permissions → needs a `ModuleKey`, `PERMISSIONS` entries, `navbarKeys` in the sidebar, and a `RouteGuard` wrapper in `page.tsx`. (e.g. `reporting-tool`, `customer-activation`)

Ask the user if unclear from context. Do not guess silently for anything touching access control.

## Step 1 — Permissions (skip if Step 0 said "always show")

Edit `src/shared/constants/permissions.ts`:

1. Add a new member to `ModuleKey` — kebab-case string matching what the backend will send in the user's navbar/permissions payload:
   ```ts
   export enum ModuleKey {
     // ...existing
     Inventory = 'inventory',
   }
   ```
2. Add an entry to `PERMISSIONS_TREE` (drives the permission-editor UI):
   ```ts
   {
     name: 'Inventory Management',
     key: `${ModuleKey.Inventory}.management`,
     type: 'CHECKBOX', // or 'RADIO' if roles are mutually exclusive
     children: [
       { name: 'View List', key: `${ModuleKey.Inventory}.list` },
       { name: 'Create', key: `${ModuleKey.Inventory}.create` },
     ],
   },
   ```
3. Add the matching lookup object under `PERMISSIONS`:
   ```ts
   Inventory: {
     Management: `${ModuleKey.Inventory}.management`,
     List: `${ModuleKey.Inventory}.list`,
     Create: `${ModuleKey.Inventory}.create`,
   },
   ```

## Step 2 — Icon

Create `src/shared/components/common/icons/icon-<module-name>.tsx` — one icon, one file, no exceptions:

```tsx
type IconProps = { className?: string }

export function Icon<ModuleName>({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="..." />
    </svg>
  )
}
```

Rules: `fill="currentColor"`, no `width`/`height` on the `<svg>`, only `className?: string` prop — see existing icons in that folder for the pattern. Re-export it from `src/shared/components/common/icons/index.tsx`:

```ts
export { Icon<ModuleName> } from './icon-<module-name>'
```

## Step 3 — Register in the sidebar (`src/shared/components/common/layout/app-sidebar.tsx`)

1. Import the icon.
2. Add one entry to `NAV_ITEMS`:
   ```ts
   {
     href: '/<module-name>',
     labelKey: '<moduleName>', // camelCase key under messages.navigation
     Icon: Icon<ModuleName>,
     // alwaysShow: true,                          // ← if Step 0 said no permission check
     navbarKeys: ['<module-name>'],                 // ← if permission-gated; must match BE navbar values (see normalize() at top of file — separators/case are ignored)
   },
   ```
3. Add `<moduleName>` under `"navigation"` in **both** `src/messages/en.json` and `src/messages/vi.json`:
   ```json
   "navigation": {
     "...": "...",
     "<moduleName>": "Inventory"
   }
   ```

Order in `NAV_ITEMS` = order in the sidebar. Put it wherever it makes sense visually (business items above the two `alwaysShow` items is the current convention).

## Step 4 — Feature folder

Scaffold `src/features/<module-name>/` following the **`nextjs-feature`** skill exactly:

```
src/features/<module-name>/
├── (helpers)/<module-name>-schema.ts     # only if it has forms
├── (services)/<module-name>-service.ts   # only if a fetcher is reused by 2+ hooks
├── (hooks)/use-<module-name>-data.ts     # types defined here, fetcher inline
├── (hooks)/use-<module-name>-actions.ts
├── (components)/<module-name>-main.tsx
└── (components)/<module-name>-main-skeleton.tsx
```

Follow every rule already in CLAUDE.md / `.github/copilot-instructions.md` while building this: logic in hooks not components, `Empty` for empty states, `OptionMenu` for row actions, `MediaLightbox` for click-to-view media, no `useMemo`/`useCallback`/`memo`/`forwardRef`, semantic color tokens only, `_custom-scroll` on scrollable containers, `Array.isArray()` guards + `?.` on every API field, max 200 lines/file, etc. This skill only covers what's specific to *becoming a module* — everything else is the project's standing rules.

## Step 5 — Route files

Create `src/app/[locale]/(private)/<module-name>/`:

**Not permission-gated** (mirror `customer-activation`):
```tsx
// page.tsx
import { ModuleNameMain } from '@/features/<module-name>/(components)/<module-name>-main'

export default function ModuleNamePage() {
  return <ModuleNameMain />
}
```

**Permission-gated** (mirror `reporting-tool`):
```tsx
// page.tsx
import { ModuleNameMain } from '@/features/<module-name>/(components)/<module-name>-main'
import { RouteGuard } from '@/shared/components/common/route-guard'
import { PERMISSIONS } from '@/shared/constants/permissions'

const REQUIRED_KEYS = [PERMISSIONS.Inventory.Management]

export default function ModuleNamePage() {
  return (
    <RouteGuard requiredKeys={REQUIRED_KEYS}>
      <ModuleNameMain />
    </RouteGuard>
  )
}
```
`RouteGuard` (`src/shared/components/common/route-guard.tsx`) renders `<ForbiddenView />` when `useHasPermission(requiredKeys)` is false — OR logic across the keys, wildcard `*` always passes, `null` permissions (not loaded yet) always passes.

```tsx
// loading.tsx — always required
import { ModuleNameMainSkeleton } from '@/features/<module-name>/(components)/<module-name>-main-skeleton'

export default function ModuleNameLoading() {
  return <ModuleNameMainSkeleton />
}
```

```tsx
// error.tsx — always required
'use client'
import { ErrorPage } from '@/shared/components/common/error-page'

export default function ModuleNameError({ error }: { error: Error }) {
  return <ErrorPage error={error} />
}
```

## Step 6 — Feature i18n namespace

Add a `<moduleName>` (camelCase) namespace to both `en.json`/`vi.json` for the feature's own strings (separate from the `navigation.<moduleName>` sidebar label added in Step 3).

## Final checklist

- [ ] `ModuleKey` + `PERMISSIONS_TREE` + `PERMISSIONS` updated (only if gated)
- [ ] One new icon file + re-exported from `icons/index.tsx`
- [ ] `NAV_ITEMS` has the new entry (`alwaysShow` XOR `navbarKeys`)
- [ ] `navigation.<moduleName>` key in `en.json` + `vi.json`
- [ ] `src/features/<module-name>/` follows the `nextjs-feature` folder layout
- [ ] `page.tsx` + `loading.tsx` + `error.tsx` all exist; `page.tsx` wrapped in `RouteGuard` only if gated
- [ ] Feature's own i18n namespace added to both locale files
- [ ] `npx tsc --noEmit` and `pnpm lint` pass
