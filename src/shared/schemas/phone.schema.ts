import { z } from 'zod';
import { getValidationMessage } from '@/lib/field-error';

type PhoneRule = 'required';

const PHONE_DIAL_CODE_ONLY_REGEX = /^\+\d{1,4}$/;

export const zPhone = (rules: PhoneRule[] = []) =>
  z
    .string()
    .catch('')
    .transform((val) => val.replace(/\s/g, ''))
    .transform((val) => (PHONE_DIAL_CODE_ONLY_REGEX.test(val) ? '' : val))
    .superRefine((val, ctx) => {
      if (rules.includes('required') && !val) {
        ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.required') });
        return;
      }
      if (!val) return;
      if (!/^\+?\d{5,20}$/.test(val)) {
        ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.phoneNumber') });
      }
    });
