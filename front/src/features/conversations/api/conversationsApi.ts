import { api } from "@/shared/api/client";
import type { Conversation } from "@/entities/conversation/model/types";
import type { UserSummary } from "@/entities/user/model/types";

export const conversationsKey = ["conversations"] as const;
export const usersKey = ["users"] as const;

export function getConversations() {
  return api<Conversation[]>("/conversations");
}
export function searchUsers(query: string) {
  return api<UserSummary[]>(`/users?q=${encodeURIComponent(query)}`);
}
export function createDirectConversation(userId: string) {
  return api<Conversation>("/conversations/direct", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}
