import type en from '@/messages/en.json';

type FieldErrorsMessages = (typeof en)['fieldErrors'];

type DotPath<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends string
        ? Prefix extends ''
          ? K
          : `${Prefix}.${K}`
        : DotPath<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
    }[keyof T & string]
  : never;

export type FieldErrorKey = `fieldErrors.${DotPath<FieldErrorsMessages>}`;

type TranslatorFn = (key: string, params?: Record<string, string | number>) => string;

let _t: TranslatorFn | null = null;

export function initFieldErrors(t: TranslatorFn) {
  _t = t;
}

export function getValidationMessage(
  key: FieldErrorKey,
  params?: Record<string, string | number>,
): string {
  if (!_t) return key;
  return _t(key, params);
}

export function translateErrorMessage(
  message: string | undefined,
  params?: Record<string, string | number>,
): string {
  if (!message) return '';
  if (message.startsWith('fieldErrors.')) {
    if (_t) {
      return _t(message, params);
    }
  }
  return message;
}

