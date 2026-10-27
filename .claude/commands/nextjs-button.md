# Button Usage

Always use `Button` from `@/shared/components/ui/button` with explicit `variant` and `size` props. Never override with raw Tailwind color/size classes.

## Available Variants

| Variant | Use when |
|---|---|
| `default` | Standard primary action |
| `outline` | Secondary action alongside a primary |
| `secondary` | Low-emphasis action |
| `ghost` | Inline actions, nav items, icon buttons |
| `destructive` | Delete, remove, danger actions |
| `link` | In-text links |

## Available Sizes

| Size | Height | Use when |
|---|---|---|
| `xs` | 24px | Dense UIs, badges |
| `sm` | 28px | Table row actions, compact toolbars |
| `default` | 32px | Standard UI controls |
| `lg` | 36px | Prominent actions, form submits |
| `icon` | 32×32px | Square icon-only button |
| `icon-xs` / `icon-sm` / `icon-lg` | — | Sized icon-only buttons |

**Nearest Size Rule**: When design specifies an unlisted height, use the nearest size. Never add `className="h-[X]px"`.

## Usage Examples

```tsx
<Button variant="default">Save changes</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete account</Button>
<Button variant="ghost" size="sm">View details</Button>
<Button variant="ghost" size="icon"><Trash2 /></Button>

// Loading state — always required for async actions
<Button type="submit" disabled={isPending}>
  {isPending && <Loader2 className="animate-spin" />}
  Save
</Button>
```

## Rules

- `className` only for layout: `w-full`, `mt-4`, `self-start` — never for color/size
- Adding a new style? Add a new `variant` or `size` to `button.tsx` CVA, not inline
- Always `disabled={isPending}` + spinner for async actions
