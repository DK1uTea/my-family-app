import { z } from 'zod';
import { getValidationMessage } from '@/lib/field-error';

type StringRule = 'required' | `min:${number}` | `max:${number}`;
type NumberRule = 'required' | `min:${number}` | `max:${number}`;

export const zString = (rules: StringRule[] = []) =>
  z
    .string()
    .catch('')
    .superRefine((val, ctx) => {
      for (const rule of rules) {
        if (rule === 'required') {
          if (!val || val.trim().length === 0) {
            ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.required') });
            return;
          }
        } else if (rule.startsWith('min:')) {
          const min = parseInt(rule.split(':')[1], 10);
          if (val.length < min) {
            ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.minLength', { min }) });
            return;
          }
        } else if (rule.startsWith('max:')) {
          const max = parseInt(rule.split(':')[1], 10);
          if (val.length > max) {
            ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.maxLength', { max }) });
            return;
          }
        }
      }
    });

export const zNumber = (rules: NumberRule[] = []) => {
  const isRequired = rules.includes('required');
  const schema = z.coerce
    .number({
      message: isRequired ? getValidationMessage('fieldErrors.required') : undefined,
    })
    .superRefine((val, ctx) => {
      for (const rule of rules) {
        if (rule === 'required') {
          if (val === undefined || val === null || isNaN(val)) {
            ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.required') });
            return;
          }
        } else if (rule.startsWith('min:')) {
          const min = parseFloat(rule.split(':')[1]);
          if (val < min) {
            ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.minValue', { min }) });
            return;
          }
        } else if (rule.startsWith('max:')) {
          const max = parseFloat(rule.split(':')[1]);
          if (val > max) {
            ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.maxValue', { max }) });
            return;
          }
        }
      }
    });

  return schema as unknown as z.ZodNumber;
};
