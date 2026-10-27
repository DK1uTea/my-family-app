export { zString, zNumber } from './string.schema';
export { zDate } from './date.schema';
export { zEmail } from './email.schema';
export { zPassword, passwordRequirements } from './password.schema';
export { zPhone } from './phone.schema';
export { zBoolean } from './boolean.schema';
export { zStringArray } from './array.schema';

import { zString, zNumber } from './string.schema';
import { zDate } from './date.schema';
import { zEmail } from './email.schema';
import { zPassword } from './password.schema';
import { zPhone } from './phone.schema';
import { zBoolean } from './boolean.schema';
import { zStringArray } from './array.schema';

/** Convenience namespace — `s.string(['required', 'min:2'])`, `s.email()`, etc. */
export const s = {
  string: zString,
  number: zNumber,
  date: zDate,
  email: zEmail,
  password: zPassword,
  phone: zPhone,
  boolean: zBoolean,
  stringArray: zStringArray,
};
