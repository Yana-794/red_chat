import { AuthForm } from "@/widgets/auth/ui/AuthForm";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0A0A0A] p-4">
      {/* angular grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      {/* scarlet top glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-105 w-170 -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.28),transparent_65%)]" />
      {/* steel-blue corner glow */}
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-105 w-105 bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_65%)]" />
      <div className="relative z-10 flex w-full justify-center">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}