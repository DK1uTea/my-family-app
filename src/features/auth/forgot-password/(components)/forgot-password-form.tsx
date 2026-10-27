'use client'

import { Input } from "@/shared/components/ui/input";
import Image from "next/image";
import { useForgotPasswordForm } from "../(hooks)/use-forgot-password-form";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from 'next-intl';

const ForgotPasswordForm = () => {

  const {
    form,
    onSubmit,
  } = useForgotPasswordForm();

  const t = useTranslations('forgotPassword');

  const {
    control,
    formState: {
      errors,
      isSubmitting,
    },
  } = form;

  const err = (key: string | undefined) =>
    key ? t(key as Parameters<typeof t>[0]) : undefined

  return (
    <div className="w-full rounded-4xl bg-card px-5 py-10 max-w-270 md:p-10 flex justify-center items-center grow border border-border">
      <div className="h-full flex flex-col gap-20 items-center justify-center max-w-105">
        <div className="flex justify-center">
          <Image
            src="/images/logo_red.png"
            alt="Logo"
            width={800}
            height={143}
            className="h-auto w-50 md:w-67.25"
            priority
          />
        </div>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <p className="font-medium text-2xl text-foreground text-center">
            {t('title')}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            {t('description')}
          </p>
          <div>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={errors.email ? true : undefined}
                  error={err(errors.email?.message)}
                  errorClassName="pl-4.5"
                  className="h-10 rounded-input! border border-border bg-input/20 px-4.5 text-base"
                />
              )}
            />
          </div>
          <Button type="submit" isLoading={isSubmitting}>
            {t('sendResetLink')}
          </Button>
          <Button variant="ghost" href="/login">
            <ChevronLeft className="text-destructive" />
            <span className="text-destructive">{t('backToLogin')}</span>
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm
