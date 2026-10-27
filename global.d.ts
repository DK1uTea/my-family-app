declare module '*.css';

import en from './src/messages/en.json';
import type { Locale } from './src/i18n/routing';

type Messages = typeof en;

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
    Locale: Locale;
  }
}
