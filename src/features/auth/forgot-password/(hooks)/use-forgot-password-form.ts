"use client";

import { useForm } from "react-hook-form";
import {
  ForgotPasswordFormData,
  forgotPasswordSchema,
} from "../(helpers)/forgot-password-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export const useForgotPasswordForm = () => {
  const t = useTranslations("forgotPassword");
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    mode: "onChange",
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });

    if (!res.ok) {
      const result = await res.json();
      const message = result?.error_code ?? result?.message;
      const text = Array.isArray(message) ? message[0] : message;
      if (text) toast.error(text);
      return;
    }

    toast.success(t("successMessage"));
    router.replace("/login" as "/");
  });

  return {
    form,
    onSubmit,
  };
};
