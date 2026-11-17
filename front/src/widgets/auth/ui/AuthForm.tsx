"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CircleAlert,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";
import { useLogin, useRegister } from "@/features/auth/model/queries";
import { GiBullHorns } from "react-icons/gi";


const STRENGTH = [
  { label: "Too weak", bar: "bg-[#E11D48]", text: "text-[#E11D48]" },
  { label: "Weak",     bar: "bg-[#F97316]", text: "text-[#F97316]" },
  { label: "Fair",     bar: "bg-[#FBBF24]", text: "text-[#FBBF24]" },
  { label: "Strong",   bar: "bg-[#38BDF8]", text: "text-[#38BDF8]" },
  { label: "Excellent", bar: "bg-[#22D3EE]", text: "text-[#22D3EE]" },
] as const;

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
};

function Field({ label, icon, trailing, id, ...props }: FieldProps) {
  return (
    <div className="border border-zinc-800 bg-[#0A0A0A] transition focus-within:border-[#E11D48]">
      <label
        htmlFor={id}
        className="block border-b border-zinc-800 bg-[#18181B] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500"
      >
        {label}
      </label>
      <div className="group flex items-center">
        <span className="pl-3 text-zinc-500 transition group-focus-within:text-[#E11D48]">
          {icon}
        </span>
        <input
          id={id}
          {...props}
          className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none"
        />
        {trailing}
      </div>
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = useLogin();
  const register = useRegister();
  const router = useRouter();

  const isRegister = mode === "register";
  const mutation = isRegister ? register : login;
  const error = mutation.error as Error | null;

  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 12) s++;
    if (password.length >= 16) s++;
    if (/[A-ZА-Я]/.test(password) && /[a-zа-я]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^\w\s]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);

  const mismatch = confirm.length > 0 && confirm !== password;
  const match = confirm.length > 0 && confirm === password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (!isRegister) {
        await login.mutateAsync({ username, password });
      } else {
        await register.mutateAsync({ username, password });
        await login.mutateAsync({ username, password });
      }
      router.replace("/messages");
    } catch {
      /* error is surfaced via mutation.error */
    }
  };

  return (
    <form
      onSubmit={submit}
      className="relative w-full max-w-md border border-zinc-800 bg-[#0A0A0A] p-8 shadow-[0_40px_100px_-30px_rgba(225,29,72,0.45)]"
    >
      <span className="absolute -left-px -top-px h-3 w-3 bg-[#E11D48]" aria-hidden />
      <span className="absolute -right-px -bottom-px h-3 w-3 bg-[#38BDF8]" aria-hidden />
      <div className="flex items-center gap-3">
        <div className="relative grid h-12 w-12 place-items-center border border-zinc-800 bg-[#18181B] text-[#E11D48]">
 <GiBullHorns className="h-6 w-6" aria-hidden />
            <span className="absolute -right-px -top-px h-2 w-2 bg-[#E11D48]" aria-hidden />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white">
            Red<span className="text-[#E11D48]">Chat</span>
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            // secure messenger
          </p>
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
        {isRegister ? "Create account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        {isRegister
          ? "Имя 3–32 символа · пароль от 12 символов"
          : "Войдите, чтобы продолжить общение"}
      </p>

      <div className="mt-7 space-y-4">
        <Field
          id="username"
          label="Username"
          icon={<AtSign size={15} />}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          minLength={3}
          maxLength={32}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="alex"
        />

        <div>
          <Field
            id="password"
            label="Password"
            icon={<Lock size={15} />}
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="mr-2 grid h-8 w-8 place-items-center text-zinc-500 transition hover:text-white focus-visible:text-white focus-visible:outline-none"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {isRegister && password.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-0.75 flex-1 transition-colors ${
                      i < strength ? STRENGTH[strength].bar : "bg-zinc-800"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${STRENGTH[strength].text}`}>
                {STRENGTH[strength].label}
              </p>
            </div>
          )}
        </div>

        {isRegister && (
          <div>
            <Field
              id="confirm"
              label="Repeat password"
              icon={<Lock size={15} />}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••••••"
            />
            {confirm.length > 0 && (
              <p
                className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${
                  match ? "text-[#38BDF8]" : "text-[#E11D48]"
                }`}
              >
                {match && <Check size={11} />}
                {match ? "Passwords match" : "Passwords don't match"}
              </p>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 border border-[#E11D48]/40 border-l-2 border-l-[#E11D48] bg-[#E11D48]/6 px-3 py-2.5 text-sm text-zinc-200"
          >
            <CircleAlert size={15} className="mt-0.5 shrink-0 text-[#E11D48]" />
            <span>{error.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || (isRegister && mismatch)}
          className="group relative flex w-full items-center justify-center gap-2 bg-[#E11D48] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#F43F5E] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Please wait…
            </>
          ) : (
            <>
              {isRegister ? "Create account" : "Sign in"}
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-600">
          or
        </span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <p className="mt-5 text-center text-sm text-zinc-400">
        {isRegister ? "Уже есть аккаунт? " : "Нет аккаунта? "}
        <a
          href={isRegister ? "/login" : "/register"}
          className="font-bold uppercase tracking-wider text-[#E11D48] underline-offset-4 transition hover:text-[#F43F5E] hover:underline"
        >
          {isRegister ? "Sign in" : "Create"}
        </a>
      </p>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-600">
        <ShieldCheck size={11} className="text-[#38BDF8]" />
        End-to-end encrypted
      </p>
    </form>
  );
}