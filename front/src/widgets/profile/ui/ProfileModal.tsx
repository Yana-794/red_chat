"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, UserRound, Loader2, CircleAlert } from "lucide-react";
import type { User } from "@/entities/user/model/types";
import { useUpdateProfile, useUploadAvatar } from "@/features/profile/model/queries";

export function ProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [username, setUsername] = useState(user.username);
  const [description, setDescription] = useState(user.description ?? "");
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const update = useUpdateProfile();
  const avatar = useUploadAvatar();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await update.mutateAsync({ username, description });
      onClose();
    } catch {
      /* shown via update.error */
    }
  };

  const selectAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    try {
      await avatar.mutateAsync(file);
    } catch {
      URL.revokeObjectURL(preview);
      setAvatarPreview(user.avatar_url ?? "");
    }
  };

  const error = update.error || avatar.error;
  const busy = update.isPending || avatar.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4"
      onMouseDown={onClose}
    >
      <form
        onSubmit={save}
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-md border border-zinc-800 bg-[#0A0A0A] p-6 shadow-[0_40px_100px_-30px_rgba(225,29,72,0.45)] sm:p-7"
      >
        <span className="absolute -left-px -top-px h-3 w-3 bg-[#E11D48]" aria-hidden />
        <span className="absolute -right-px -bottom-px h-3 w-3 bg-[#38BDF8]" aria-hidden />

        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="profile-title"
              className="text-base font-bold uppercase tracking-[0.15em] text-white"
            >
              // Profile
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Account settings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="grid h-8 w-8 place-items-center border border-zinc-800 text-zinc-400 transition hover:border-[#E11D48] hover:text-[#E11D48]"
          >
            <X size={15} />
          </button>
        </div>

        {/* avatar */}
        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative grid h-24 w-24 place-items-center overflow-hidden border border-zinc-700 bg-[#18181B] text-3xl font-bold text-white"
            aria-label="Изменить аватар"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Аватар" className="h-full w-full object-cover" />
            ) : (
              username[0]?.toUpperCase() ?? <UserRound size={28} className="text-zinc-500" />
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/70 text-[#E11D48] opacity-0 transition group-hover:opacity-100">
              {avatar.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Camera size={20} />
              )}
            </span>
            <span className="absolute -right-px -top-px h-2 w-2 bg-[#E11D48]" aria-hidden />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={selectAvatar}
          />
          <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            JPG · PNG · WEBP · GIF · 5 MB
          </p>
        </div>

        {/* fields */}
        <div className="mt-6 space-y-4">
          <div className="border border-zinc-800 bg-[#0A0A0A] transition focus-within:border-[#E11D48]">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181B] px-3 py-1.5">
              <label
                htmlFor="profile-username"
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500"
              >
                Username
              </label>
              <span className="text-[10px] tabular-nums text-zinc-600">
                {username.length}/32
              </span>
            </div>
            <div className="flex items-center">
              <span className="pl-3 text-zinc-500">
                <UserRound size={14} />
              </span>
              <input
                id="profile-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={32}
                required
                autoComplete="username"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-600 outline-none"
              />
            </div>
          </div>

          <div className="border border-zinc-800 bg-[#0A0A0A] transition focus-within:border-[#E11D48]">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181B] px-3 py-1.5">
              <label
                htmlFor="profile-description"
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500"
              >
                About
              </label>
              <span
                className={`text-[10px] tabular-nums ${
                  description.length > 450 ? "text-[#E11D48]" : "text-zinc-600"
                }`}
              >
                {description.length}/500
              </span>
            </div>
            <textarea
              id="profile-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-white placeholder:text-zinc-600 outline-none"
              placeholder="Пара слов о себе…"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 border border-[#E11D48]/40 border-l-2 border-l-[#E11D48] bg-[#E11D48]/6 px-3 py-2 text-sm text-zinc-200"
            >
              <CircleAlert size={14} className="mt-0.5 shrink-0 text-[#E11D48]" />
              <span>{error.message}</span>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-zinc-800 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 bg-[#E11D48] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#F43F5E] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {update.isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}