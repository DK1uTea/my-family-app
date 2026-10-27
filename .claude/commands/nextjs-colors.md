# Color Token Rules

All colors must come from semantic tokens in `src/app/globals.css`. Never hardcode color values. If a token doesn't exist, define it in both `:root` and `.dark` first.

## Existing Tokens

| Token | Tailwind class | Use |
|---|---|---|
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Primary text |
| `--muted` | `bg-muted` | Subtle background |
| `--muted-foreground` | `text-muted-foreground` | Secondary text |
| `--card` | `bg-card` | Card surface |
| `--primary` | `bg-primary` / `text-primary` | Primary action |
| `--primary-foreground` | `text-primary-foreground` | Text on primary |
| `--destructive` | `bg-destructive` / `text-destructive` | Error / danger |
| `--border` | `border-border` | All borders |
| `--input` | `border-input` | Form input borders |
| `--chart-1…5` | `bg-chart-1…5` | Data viz |
| `--sidebar` | `bg-sidebar` | Sidebar background |

## Adding a New Token

1. Define in `src/app/globals.css` — both `:root` and `.dark`:
```css
:root { --success: oklch(0.65 0.15 145); --success-foreground: oklch(0.985 0 0); }
.dark { --success: oklch(0.55 0.13 145); --success-foreground: oklch(0.985 0 0); }
```

2. Register in `@theme inline`:
```css
@theme inline {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}
```

3. Use: `<span className="bg-success text-success-foreground">`

## Rules

- Never hardcode hex/rgb/oklch in JSX/TSX — only in `globals.css`
- Never use `dark:` prefix for color overrides — semantic tokens handle dark mode
- Never use Tailwind's built-in palette (`bg-gray-100`, `text-blue-500`)
- Always use `oklch()` color space for new tokens
