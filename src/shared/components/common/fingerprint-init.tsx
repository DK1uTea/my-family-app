'use client';

import { useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function FingerprintInit() {
  useEffect(() => {
    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => {
        localStorage.setItem('fingerprint', result.visitorId);
      });
  }, []);

  return null;
}
