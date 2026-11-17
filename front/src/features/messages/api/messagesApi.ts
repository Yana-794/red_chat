import { api } from "@/shared/api/client";
import type { Message, MessagesPage } from "@/entities/message/model/types";

export const messagesKey = ["messages"] as const;
export const messagesKeyFor = (conversationId: string) => [...messagesKey, conversationId] as const;

export function getMessages(conversationId: string, beforeId?: number) {
  const params = new URLSearchParams({ limit: "30" });
  if (beforeId) params.set("before_id", String(beforeId));
  return api<MessagesPage>(`/conversations/${conversationId}/messages?${params.toString()}`);
}

export function createMessage(conversationId: string, content: string) {
  return api<Message>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function uploadConversationFile(conversationId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return api<Message>(`/conversations/${conversationId}/files`, {
    method: "POST",
    body,
  });
}

export function updateMessage(id: number, content: string) {
  return api<Message>(`/messages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export function deleteMessage(id: number) {
  return api<void>(`/messages/${id}`, { method: "DELETE" });
}

export function toggleReaction(id: number, emoji: string) {
  return api<void>(`/messages/${id}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
}
