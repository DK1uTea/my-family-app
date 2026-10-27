---
name: accessibility
description: Accessibility rules every generated component must satisfy — labels, accessible names, keyboard reachability, focus, error announcement, colour contrast. MUST be applied whenever writing or changing any JSX that a user interacts with. Triggers on "component", "form", "input", "button", "modal", "dialog", "dropdown", "icon button", "a11y", "accessibility", "screen reader", "keyboard", "contrast", "aria".
triggers:
  - new component
  - form
  - input field
  - icon button
  - modal
  - dialog
  - dropdown
  - accessibility
  - a11y
  - screen reader
  - keyboard navigation
  - focus
  - aria
  - contrast
---

# Accessibility

Every interactive thing you generate must be usable without a mouse and without sight.
This is not a polish pass at the end — a component that ships unlabelled is a component
that has to be found, re-tested and re-released later.

Reference implementation: `src/features/auth/login/(components)/login-form.tsx`, guarded by
`e2e/modules/login/a11y.spec.ts` and `tests/shared/components/ui/input.test.tsx`.

## The Five Checks Before You Call a Component Done

1. **Can every control be reached and operated by keyboard alone?** Tab to it, Enter/Space
   to activate it.
2. **Does every control have an accessible name?** Not a placeholder — a name.
3. **Is state exposed, not just painted?** `aria-pressed`, `aria-expanded`, `aria-invalid`,
   `aria-current`.
4. **Is every error tied to its field and announced?** `aria-describedby` + `role="alert"`.
5. *(Contrast is deliberately not checked — the per-tenant theme owns the palette.)*

## Rules

### Labels — a placeholder is not a label

A placeholder vanishes the moment the user types and is not a reliable accessible name.
Every input, textarea and select needs a real `<label htmlFor>`.

```tsx
// ❌ Placeholder as the only name — the field is unnamed once it has a value
<Input placeholder={t('emailPlaceholder')} />

// ✅ Real label, placeholder demoted to a hint
const EMAIL_FIELD_ID = 'login-email';

<Label htmlFor={EMAIL_FIELD_ID}>
  {t('email')}
  {/* Decoration only. `required` is what conveys "mandatory" to assistive tech;
      an unhidden asterisk gets announced as "star". */}
  <span aria-hidden="true" className="text-primary">*</span>
</Label>
<Input id={EMAIL_FIELD_ID} required placeholder={t('emailPlaceholder')} />
```

Use stable module-level id constants, not `useId()`, when a test or a sibling has to
reference the id.

### Icon-only buttons need `aria-label`

An icon is invisible to a screen reader. If the state changes, the name changes with it.

```tsx
// ❌ Unnamed, and tabIndex={-1} removes the only way a keyboard user could reach it
<button type="button" tabIndex={-1} onClick={togglePassword}>
  <EyeIcon />
</button>

// ✅
<button
  type="button"
  onClick={togglePassword}
  aria-label={isPasswordShown ? t('hidePassword') : t('showPassword')}
  aria-pressed={isPasswordShown}
  aria-controls={PASSWORD_FIELD_ID}
  className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
>
  {isPasswordShown ? <EyeOffIcon /> : <EyeIcon />}
</button>
```

Both label strings are i18n keys and go into **`en.json` and `de.json` together**.

**Never `tabIndex={-1}` on something a user must be able to operate.** It is only for
elements focused programmatically.

### Errors must be linked and announced

Rendering the message next to the field is not enough — WCAG 3.3.1 requires a
programmatic association.

`Input` already does this for you: pass `error` and it wires `aria-describedby` to a
`role="alert"` paragraph, preserving any `aria-describedby` you passed. `InputGroup` needs
the id passed explicitly because the control is a child:

```tsx
<InputGroup error={passwordError} errorId={PASSWORD_ERROR_ID}>
  <InputGroupInput
    id={PASSWORD_FIELD_ID}
    aria-invalid={errors.password ? true : undefined}
    aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
  />
</InputGroup>
```

Always pair the message with `aria-invalid` on the control.

### Never remove the focus ring

`outline-none` without a `focus-visible:` replacement makes the component unusable for
keyboard users. Always pair them:

```tsx
className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
```

### Contrast — NOT enforced; the theme owns the palette

**Colour contrast is out of scope for this repo. Do not "fix" it, do not test it, do not
report it as a finding.**

Every colour and border comes from the per-tenant theme in `src/styles/themes/<tenant>.css`,
which is configured by design to match an approved brand. The palette is a product decision
owned by design and the tenant, not something code or a test may drive. The Brand brand red
(`--primary: oklch(0.537 0.277 27.3)`, #F40009) puts white 16px button text at 4.21:1
against WCAG AA's 4.5:1 — "fixing" that would mean repainting the brand.

- `scanA11y` (`e2e/shared/a11y.ts`) disables the axe `color-contrast` rule for every scan
  repo-wide. Do not re-enable it, and do not add per-spec contrast exceptions.
- Never write a test that asserts a contrast ratio.
- Never change a colour, opacity modifier or border token in order to raise contrast. If a
  shade genuinely looks wrong, that is a design conversation, not a code change.

This is the **only** blanket accessibility exemption. Everything else axe reports is a real
finding — accessible names, labels, roles, focus order and error wiring are all still
enforced, and `.disableRules()` may never be used to turn any of those green.

### Dialogs, sheets, menus

- Every `DialogContent` / `SheetContent` needs a `DialogTitle` / `SheetTitle` — use
  `className="sr-only"` when it is visually redundant. Radix warns in the console and
  `e2e/*-a11y.spec.ts`'s console check will fail the build.
- Radix handles focus trapping and Escape. Do not reimplement them.
- A `role="checkbox"` from Radix renders alongside a hidden native input — when writing
  tests, always qualify `getByRole('checkbox', { name })`.

### Images and icons

- Meaningful image → real `alt`. Decorative → `alt=""`, never a missing `alt`.
- Decorative inline SVG → `aria-hidden="true"`.
- Never put "image of" / "icon of" in `alt`.

### Page language

`<html lang>` must match the rendered locale (WCAG 3.1.1) — without it a screen reader
reads German text with English pronunciation. `src/app/layout.tsx` derives it from the
`NEXT_LOCALE` cookie that `src/proxy.ts` maintains.

## What Enforces This

| Layer | Catches | Command |
|---|---|---|
| `eslint-plugin-jsx-a11y` | Missing labels, bad ARIA, unnamed controls | `pnpm lint` |
| `@axe-core/playwright` | Roles, names, landmarks, at runtime (contrast disabled) | `pnpm test:e2e` |
| Component tests | Error wiring, disabled/loading states | `pnpm test` |
| Manual keyboard pass | Focus order, traps, visible focus | you, in the browser |

**The eslint config is a ratchet.** The recommended set runs at `warn` because ~78
pre-existing violations across 39 files would otherwise block every commit; rules already
at zero violations run at `error`, and `src/features/auth/**` runs everything at `error`.
When you clear a warn-level rule repo-wide, promote it to `error` in `eslint.config.mjs`.
**Never add a new violation of a warn-level rule** — warn means "legacy debt", not
"optional".

No automated tool catches focus order, a keyboard trap, or a label that is technically
present but meaningless. Tab through anything you build.

## Testing New UI

Add an `e2e/<feature>-a11y.spec.ts` next to the feature spec for anything with a form or a
custom widget:

```ts
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

expect(results.violations).toEqual([]);
```

Scan twice — once on the clean page, once with validation errors on screen. Error states
are where association regressions actually appear.

**Never silence a violation with `.disableRules()` to get green** — the one standing
exception is the `color-contrast` theme exemption already applied inside `scanA11y`
(`e2e/shared/a11y.ts`); never add another. Fix it, or state the
failure plainly and let a human decide.

## Red Flags

- A form field whose only name is its placeholder
- An icon button with no `aria-label`
- `tabIndex={-1}` on something the user needs to operate
- `outline-none` with no `focus-visible:` replacement
- An opacity modifier used to make text look secondary
- A raw palette colour in JSX
- An error message with no `aria-describedby` from its field
- `<div onClick>` where a `<button>` belongs
- Adding a new violation of a rule that currently only warns
- Disabling an axe rule to make a test pass

## Verification Checklist

- [ ] Tabbed through the component: every control reachable, focus always visible
- [ ] Every control has an accessible name that is not the placeholder
- [ ] Toggle/expand state exposed via `aria-pressed` / `aria-expanded`
- [ ] Errors carry `aria-describedby` + `role="alert"`, control has `aria-invalid`
- [ ] `pnpm lint` reports no new a11y warnings and zero a11y errors
- [ ] The axe scan passes clean **and** with errors displayed
- [ ] New `aria-label` strings exist in both `en.json` and `de.json`
