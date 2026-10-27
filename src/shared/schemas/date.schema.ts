import { z } from 'zod';
import { getValidationMessage } from '@/lib/field-error';

type DateRule =
  | 'required'
  | `minDate:${string}`
  | `maxDate:${string}`
  | `afterDate:${string}`
  | `beforeDate:${string}`;

export const zDate = (rules: DateRule[] = []) =>
  z.coerce.date().superRefine((val, ctx) => {
    for (const rule of rules) {
      if (rule === 'required') {
        if (!val || isNaN(val.getTime())) {
          ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.required') });
          return;
        }
      } else if (rule.startsWith('minDate:')) {
        const minDate = new Date(rule.split(':')[1]);
        if (val < minDate) {
          ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.minDate', { date: minDate.toLocaleDateString() }) });
          return;
        }
      } else if (rule.startsWith('maxDate:')) {
        const maxDate = new Date(rule.split(':')[1]);
        if (val > maxDate) {
          ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.maxDate', { date: maxDate.toLocaleDateString() }) });
          return;
        }
      } else if (rule.startsWith('afterDate:')) {
        const afterDate = new Date(rule.split(':')[1]);
        if (val <= afterDate) {
          ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.afterDate', { date: afterDate.toLocaleDateString() }) });
          return;
        }
      } else if (rule.startsWith('beforeDate:')) {
        const beforeDate = new Date(rule.split(':')[1]);
        if (val >= beforeDate) {
          ctx.addIssue({ code: 'custom' as const, message: getValidationMessage('fieldErrors.beforeDate', { date: beforeDate.toLocaleDateString() }) });
          return;
        }
      }
    }
  });
