import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtmlTags(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export function getUserInitials(value?: string) {
  if (!value) {
    return 'U';
  }

  const [first = '', second = ''] = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || 'U';
}
