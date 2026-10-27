# 02 — Design System

## Frontend Design Philosophy

**Feature-based architecture** — Code is co-located by domain, not by type. A feature owns its hooks and components in one folder. Adding a new page means creating a new feature folder; removing a feature means deleting one folder with no cross-cutting impact. Shared code is promoted only when genuinely needed across multiple features.

**Zero-delay interactions** — Two mechanisms eliminate the UI lag that plagues traditional dashboards:
- `loading.tsx` (React Suspense) — Next.js streams the page shell immediately and shows the skeleton while data loads. The user sees content instantly instead of a blank page.
- **nuqs URL state** — Filter, search, and pagination changes are applied to the URL synchronously via `history.pushState`. The input responds immediately and the data refetches in the background.

**Theme-agnostic components** — All components consume only semantic tokens (`bg-primary`, `text-muted-foreground`, …). Swapping an entire brand theme is a single CSS file change — zero component code changes.

**Crash isolation via error boundaries** — Every page route has a sibling `error.tsx` that catches render errors at the route level, preventing a single broken page from crashing the entire app. The error boundary renders `<ErrorPage>` from `@/shared/components/common/error-page` and exposes a retry button via the `reset` prop Next.js passes automatically.

```
app/[locale]/(private)/user-management/
  page.tsx       ← feature entry point
  loading.tsx    ← skeleton (React Suspense)
  error.tsx      ← error boundary (catches render errors for this route only)
```

```tsx
// error.tsx — minimal, required on every page route
'use client';
import { ErrorPage } from '@/shared/components/common/error-page';

export default function Error({ error }: { error: Error }) {
  return <ErrorPage error={error} />;
}
```

## Token Architecture (three layers)

```
globals.css  (@theme inline)
    └─ maps --color-* Tailwind variables
           └─ to CSS custom properties (--background, --primary, …)
                  └─ defined per tenant in styles/themes/<tenant>.css
```

All colors are declared in **oklch color space** for perceptual uniformity across light and dark modes.

## Color Token Taxonomy

| Category | Key Tokens | Use |
|---|---|---|
| Surface | `bg-background`, `bg-card`, `bg-muted`, `bg-popover` | Page, card, subtle, dropdown backgrounds |
| Typography | `text-foreground`, `text-muted-foreground`, `text-card-foreground` | Primary, secondary, card text |
| Brand / Interactive | `bg-primary`, `bg-secondary`, `bg-accent` | CTA buttons, active states, hover highlights |
| Semantic States | `bg-destructive`, `text-destructive` | Error, delete, danger actions |
| Borders / Inputs | `border-border`, `border-input` | All borders and form input borders |
| Focus | `ring-ring` | Keyboard focus indicators |
| Sidebar | `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-primary` | Navigation panel (tenant-branded, same in light/dark) |
| Charts | `bg-chart-1` … `bg-chart-5` | Data visualisation series |
| Brand Surfaces | `bg-background-header`, `bg-background-login` | Header bar, login page background |

## Tenant Theming

Each tenant is a single CSS file under `src/styles/themes/<tenant>.css` that overrides all `:root` and `.dark` custom properties. Adding a new tenant requires:

1. Copy `_template.css` → `<tenant>.css`
2. Fill in all token values using oklch
3. `@import '../styles/themes/<tenant>.css'` in `globals.css`
4. No component code changes required

**Default theme:** `default.css`

## Typography

The project uses standard modern typography configured via Next.js `next/font/google` and Tailwind v4 `@theme inline`:

| Tailwind class | CSS variable | Use |
|---|---|---|
| `font-sans` | `--font-family-brand` | Default body text |
| `font-brand-narrow` | `--font-family-brand-narrow` | Compact headings, data labels |
| `font-brand-wide` | `--font-family-brand-wide` | Hero / display text |

## Radius Scale

```css
--radius: 0.5rem              /* 8px  — general UI elements */
--button-radius: 2.5rem       /* 40px — pill-shaped buttons */
--input-radius: 2.5rem        /* 40px — text inputs */
--input-group-radius: 2.5rem  /* 40px — grouped inputs */
--select-radius: 2.5rem       /* 40px — select triggers */
--textarea-radius: 0.5rem     /* 8px  — multiline inputs */
--textarea-float-radius: 0.625rem /* 10px — floating textareas */
--date-picker-radius: 2.5rem  /* 40px — date triggers */
--detail-field-radius: 2.5rem /* 40px — read-only fields */
--choice-radius: 2.5rem       /* 40px — choice options */
--sidebar-item-radius: 1.25rem /* 20px — sidebar nav items */
```

Component families intentionally do not consume `--button-radius` directly. Each family
has its own token and Tailwind utility (`rounded-button`, `rounded-input`,
`rounded-input-group`, `rounded-select`, and so on), so a tenant can tune controls
independently even when their current values happen to match.

## Dark Mode

Dark mode is toggled via `class="dark"` on `<html>` (`next-themes`, `attribute="class"`, `defaultTheme="dark"`). Every token has a `.dark` counterpart in the theme file.

**No `.dark:` utility classes appear in component files** — the semantic token system handles all mode transitions automatically.

---

*Next: `03-AUTH-AND-AUTHORIZATION.md`.*
