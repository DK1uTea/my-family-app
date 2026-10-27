'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { LoginForm } from './login-form';

export function LoginCaptchaWrapper() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}
    >
      <LoginForm />
    </GoogleReCaptchaProvider>
  );
}
