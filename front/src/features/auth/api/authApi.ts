import { api, setCSRFToken } from "@/shared/api/client";
import type { AuthPayload, User } from "@/entities/user/model/types";
export async function login(data: { username: string; password: string }) {
  const result = await api<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setCSRFToken(result.csrf_token);
  return result.user;
}
export async function register(data: { username: string; password: string }) {
  return api<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export async function me() {
  const result = await api<AuthPayload>("/auth/me");
  setCSRFToken(result.csrf_token);
  return result.user;
}
export async function logout() {
  await api<void>("/auth/logout", { method: "POST" });
  setCSRFToken("");
}
