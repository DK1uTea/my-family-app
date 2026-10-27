'use client'

import { AuthFooterCopyright } from "../../(components)/auth-footer-copyright";
import RegistrationForm from "./registration-form";
import { useVerifyInvite } from "../(hooks)/use-verify-invite";
import { Loader2 } from "lucide-react";

const RegistrationMain = () => {
  const { isVerifying, isReady, email, code } = useVerifyInvite()

  return (
    <div className="relative min-h-screen flex w-full shrink-0 flex-col items-center justify-center gap-8 p-4 md:py-14">
      {isVerifying && (
        <div className="flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {isReady && email && <RegistrationForm email={email} code={code} />}
      <AuthFooterCopyright />
    </div>
  );
}

export default RegistrationMain
