"use client"
import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeClosed, type LucideIcon } from "lucide-react";

interface InputAuthProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'error'> {
  label: string;
  error?: string;
  icon: LucideIcon;
  type?: string;
  hasError: boolean;
}

const InputAuth: React.FC<InputAuthProps> = ({
  label,
  error,
  onChange,
  onBlur,
  disabled,
  type = "text",
  icon: Icon,
  value,
  name,
  hasError = false,
  ...props
}) => {
  const id = useId();
  const errorId = `${id}-error`;

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const toggleShowPassword = (): void => {
    setShowPassword((prev) => !prev);
  };

  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-6 relative">
      {label && (
        <label
          htmlFor={id}
          className={`text-gray-200 text-sm font-medium mb-2 flex items-center gap-2
            ${disabled ? "text-slate-500" : "text-slate-300"}
            ${hasError && !disabled ? "text-rose-400" : ""}`}
        >
          {Icon && <Icon stroke="#ff6251" size={17} />}
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          type={inputType}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={`w-full pl-12 pr-4 py-3.5 bg-[#0a0e27]/60 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200
            ${hasError 
              ? "border-rose-500/50 hover:border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" 
              : "border-red-900/30 focus:ring-red-600 focus:border-red-600/50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed bg-slate-900/50 border-slate-800" : ""}
          `}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? (
              <Eye color="#ff6251" size={20} />
            ) : (
              <EyeClosed color="#ff6251" size={20} />
            )}
          </button>
        )}
      </div>
      {error && hasError && (
        <p
          id={errorId}
          className="text-xs font-medium text-rose-500 mt-1.5 ml-2"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default InputAuth;