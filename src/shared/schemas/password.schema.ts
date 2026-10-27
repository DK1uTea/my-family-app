import { getValidationMessage, type FieldErrorKey } from '@/lib/field-error';
import { zString } from './string.schema';

type PasswordRequirement = {
  labelKey: string;
  messageKey: FieldErrorKey;
  test: (value: string) => boolean;
};

export const passwordRequirements: PasswordRequirement[] = [
  {
    labelKey: 'atLeast8Characters',
    messageKey: 'fieldErrors.password.minLength',
    test: (value) => value.length >= 8,
  },
  {
    labelKey: 'oneLowercaseLetter',
    messageKey: 'fieldErrors.password.lowercase',
    test: (value) => /[a-z]/.test(value),
  },
  {
    labelKey: 'oneUppercaseLetter',
    messageKey: 'fieldErrors.password.uppercase',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    labelKey: 'oneNumber',
    messageKey: 'fieldErrors.password.number',
    test: (value) => /\d/.test(value),
  },
  {
    labelKey: 'oneSpecialCharacter',
    messageKey: 'fieldErrors.password.special',
    test: (value) => /[@$!%*?&\-+=\#.]+/.test(value),
  },
];

export const zPassword = () =>
  zString(['required']).superRefine((val, ctx) => {
    if (!val) return;
    for (const requirement of passwordRequirements) {
      if (!requirement.test(val)) {
        ctx.addIssue({ code: 'custom' as const, message: getValidationMessage(requirement.messageKey) });
      }
    }
  });
