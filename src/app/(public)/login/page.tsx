"use client";
import Head from "@/src/ui/components/head";
import { HeadType } from "@/src/ui/components/head";
import AuthForm from "@/src/feature/auth/ui/authForm";
import UpLink from "@/src/ui/components/up-link";
import Safety from "@/src/ui/components/safety";
const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-[#0a0e27]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)",
          }}
        ></div>

        <div
          className="animate-blob absolute top-1/3 right-1/4 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(220, 38, 38, 0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        ></div>

        <div
          className="animate-blob animation-delay-2000 absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(185, 28, 28, 0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        ></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        <div
          className="
                    bg-linear-to-b 
                    from-[#0f1422]/95 
                    to-[#0a0e27]/95 
                    backdrop-blur-2xl 
                    rounded-3xl 
                    shadow-2xl 
                    border 
                    border-red-900/30 
                    p-8 
                    md:p-10
                "
        >
          <Head type={HeadType.LOGIN} />
          <AuthForm />
          <UpLink
            authQuestion="Нет аккаунта"
            formType="Зарегистрироваться"
            to="/register"
          />
        </div>
        <Safety />
      </div>
    </div>
  );
};
export default LoginPage;
