import { z } from 'zod';
import { getValidationMessage } from '@/lib/field-error';

type BooleanRule = 'required';

export const zBoolean = (rules: BooleanRule[] = []) =>
  z.boolean().superRefine((val, ctx) => {
    for (const rule of rules) {
      if (rule === 'required') {
        if (val === undefined || val === null) {
          ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.required') });
          return;
        }
      }
    }
  });
