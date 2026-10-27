# Form Patterns

Set up forms using react-hook-form v7 + zod v4 + @hookform/resolvers.

## Key Rules

- Logic in hooks: `useForm`, `zodResolver`, submit handler live in hooks, not components
- Components only render — no validation logic in JSX
- `FormProvider` for forms where child components need form state via `useFormContext()`
- Zod schemas in `(helpers)/feature-name-schema.ts` — never inline
- Translate error messages — use `useTranslations` keys for zod messages
- Max 200 lines per file
- For API-backed form defaults containing encoded names/text, use `unescapeHTML` from `@/lib/html`; for outbound text that must be HTML-escaped, use `escapeHTML` from `@/lib/html`. Do not add per-feature escape helpers.

## Simple Form Template

```ts
// (helpers)/create-user-schema.ts
import { z } from 'zod';
export const createUserSchema = z.object({
  name: z.string().min(1, 'validation.nameRequired'),
  email: z.string().email('validation.emailInvalid'),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;
```

```ts
// (hooks)/use-create-user-form.ts
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserDto } from '../(helpers)/create-user-schema';

export function useCreateUserForm(onSuccess: () => void) {
  const form = useForm<CreateUserDto>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '' },
  });
  const onSubmit = form.handleSubmit((data) => {
    // call mutation here
  });
  return { form, onSubmit };
}
```

## Multi-Step FormProvider Template

```tsx
// (components)/register-form.tsx
'use client';
import { FormProvider } from 'react-hook-form';
import { useRegisterForm } from '../(hooks)/use-register-form';
import { PersonalInfoStep } from './personal-info-step';

export function RegisterForm() {
  const { methods, currentStep, onSubmit } = useRegisterForm();
  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        {currentStep === 0 && <PersonalInfoStep />}
      </form>
    </FormProvider>
  );
}
```

```tsx
// (components)/personal-info-step.tsx
'use client';
import { useFormContext } from 'react-hook-form';
import type { RegisterDto } from '../(helpers)/register-schema';

export function PersonalInfoStep() {
  const { register, formState: { errors } } = useFormContext<RegisterDto>();
  return (
    <div className="space-y-4">
      <input {...register('name')} />
      {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
    </div>
  );
}
```
