import { webcrypto } from 'node:crypto';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18next.use(initReactI18next).init({
  // Simple resources for testing
  resources: { en: { translation: { admin_console: { general: { add: 'Add' } } } } },
  lng: 'en',
  react: { useSuspense: false },
});

/* eslint-disable @silverhand/fp/no-mutating-methods -- jsdom's crypto lacks subtle */
Object.defineProperty(crypto, 'subtle', { value: webcrypto.subtle });
/* eslint-enable @silverhand/fp/no-mutating-methods */
