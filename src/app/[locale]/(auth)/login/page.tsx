import Image from 'next/image'
import { AuthFooterCopyright } from '@/features/auth/(components)/auth-footer-copyright'
import { LoginCaptchaWrapper } from '@/features/auth/login/(components)/login-captcha-wrapper'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-stretch justify-center gap-20 bg-background-login p-4 md:h-screen md:justify-between md:overflow-hidden md:px-0 md:py-0">
      <div className="hidden flex-1 overflow-hidden md:flex md:justify-start md:self-stretch">
        <div className="relative h-full w-62.5 shrink-0">
          <Image
            src="/images/login/layout-login_left.png"
            alt=""
            fill
            sizes="250px"
            className="object-cover object-right"
            priority
          />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-center gap-5 md:h-full md:min-h-0 md:w-fit md:gap-4 md:overflow-y-auto md:pb-6 md:[@media(min-height:760px)]:pb-10 no-scrollbar">
        <div className="flex w-full flex-1 items-center justify-center">
          <LoginCaptchaWrapper />
        </div>
        <AuthFooterCopyright className="shrink-0 text-white" />
      </div>

      <div className="hidden flex-1 overflow-hidden md:flex md:justify-end md:self-stretch">
        <div className="relative h-full w-62.5 shrink-0">
          <Image
            src="/images/login/layout_login_right.png"
            alt=""
            fill
            sizes="250px"
            className="object-cover object-left"
            priority
          />
        </div>
      </div>
    </div>
  )
}
