"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useRouter } from "@/i18n/navigation";
import { apiProxy } from "@/lib/api";
import { getErrorMessage } from "@/lib/get-error-message";
import { CAPTCHA_BYPASS_ENABLED } from "@/lib/verify-captcha";
import { zEmail } from "@/shared/schemas";
import type { AxiosError } from "axios";

const DEFAULT_LOGIN_BLOCK_MINUTES = 15;
const SECONDS_PER_MINUTE = 60;
const ACCOUNT_LOCKED_ERROR_CODE = "AUTH.LOGIN.ACCOUNT_LOCKED";
const CAPTCHA_READY_POLL_INTERVAL_MS = 100;
const CAPTCHA_READY_MAX_POLLS = 50;

const loginSchema = z.object({
  email: zEmail(),
  password: z
    .string()
    .min(1, "validation.passwordRequired")
    .min(6, "validation.passwordMin"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useLoginForm() {
  const router = useRouter();
  const t = useTranslations("login");
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const executeRecaptchaRef = useRef(executeRecaptcha);
  executeRecaptchaRef.current = executeRecaptcha;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    let captchaToken = "";

    if (!CAPTCHA_BYPASS_ENABLED) {
      let pollCount = 0;
      while (
        !executeRecaptchaRef.current &&
        pollCount < CAPTCHA_READY_MAX_POLLS
      ) {
        await delay(CAPTCHA_READY_POLL_INTERVAL_MS);
        pollCount += 1;
      }

      if (!executeRecaptchaRef.current) {
        toast.error(t("captchaNotReady"));
        return;
      }

      captchaToken = await executeRecaptchaRef.current("login");
    }

    try {
      const response = await apiProxy.post(
        "/auth/login",
        { ...data, captchaToken },
        { _skipToast: true } as object,
      );

      if (response.status === 203) {
        const message = response.data?.message;
        const text = Array.isArray(message) ? message[0] : message;
        if (text) toast.warning(text);
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirectTo") ?? "/dashboards";
      router.replace(redirectTo as "/");
    } catch (err) {
      const axiosError = err as AxiosError<{
        error_code?: string;
        attemptsRemaining?: number;
        loginBlockDuration?: number;
      }>;
      const errorData = axiosError.response?.data;

      if (errorData?.error_code === ACCOUNT_LOCKED_ERROR_CODE) {
        // Show the lockout message inline under the password field instead of a toast.
        form.setError("password", {
          type: "server",
          message: t("accountLockedWithDuration", {
            minutes: errorData.loginBlockDuration
              ? Math.ceil(errorData.loginBlockDuration / SECONDS_PER_MINUTE)
              : DEFAULT_LOGIN_BLOCK_MINUTES,
          }),
        });
        return;
      }

      const attemptsRemaining = errorData?.attemptsRemaining;
      if (attemptsRemaining !== undefined) {
        // Show the invalid-credentials message inline under the password field instead of a toast.
        form.setError("password", { type: "server", message: t("attemptsRemaining", { count: attemptsRemaining }) });
        return;
      }

      toast.error(getErrorMessage(errorData?.error_code));
    }
  });

  return {
    form,
    isPasswordShown,
    togglePassword: () => setIsPasswordShown((v) => !v),
    onSubmit,
  };
}
