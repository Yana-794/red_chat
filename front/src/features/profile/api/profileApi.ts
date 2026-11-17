import { api, setCSRFToken } from "@/shared/api/client";
import type { User } from "@/entities/user/model/types";

export async function updateProfile(data: { username: string; description: string }) {
  const result = await api<{ user: User; csrf_token: string }>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  setCSRFToken(result.csrf_token);
  return result.user;
}

export async function uploadAvatar(file: File) {
  const body = new FormData();
  body.append("avatar", file);
  const result = await api<{ user: User }>("/auth/avatar", { method: "POST", body });
  return result.user;
}
