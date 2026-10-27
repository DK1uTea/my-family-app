'use client'

import { Loader2 } from 'lucide-react'
import { AuthFooterCopyright } from '../../(components)/auth-footer-copyright'
import ResetPasswordForm from './reset-password-form'
import { useVerifyResetToken } from '../(hooks)/use-verify-reset-token'

const ResetPasswordMain = () => {
  const { isVerifying, isReady, token } = useVerifyResetToken()

  return (
    <div className="relative min-h-screen flex w-full shrink-0 flex-col items-center justify-center gap-8 p-4 md:py-10">
      {isVerifying && (
        <div className="flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {isReady && <ResetPasswordForm token={token} />}
      <AuthFooterCopyright />
    </div>
  )
}

export default ResetPasswordMain
