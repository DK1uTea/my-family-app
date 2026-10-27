import ForgotPasswordForm from "./forgot-password-form";
import { AuthFooterCopyright } from "../../(components)/auth-footer-copyright";

const ForgotPasswordMain = () => {

  return (
    <div className="relative min-h-screen flex w-full shrink-0 flex-col items-center justify-center gap-8 p-4 md:py-10">
      <ForgotPasswordForm />
      <AuthFooterCopyright />
    </div>
  );
}

export default ForgotPasswordMain
