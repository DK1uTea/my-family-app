'use client';

import { useTranslations } from 'next-intl';
import { initFieldErrors } from './field-error';

export function FieldErrorsInit() {
  const t = useTranslations();
  initFieldErrors(t as (key: string, params?: Record<string, string | number>) => string);
  return null;
}
