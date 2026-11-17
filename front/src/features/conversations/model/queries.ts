import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  conversationsKey,
  createDirectConversation,
  getConversations,
  searchUsers,
  usersKey,
} from "@/features/conversations/api/conversationsApi";

export function useConversations(enabled = true) {
  return useQuery({ queryKey: conversationsKey, queryFn: getConversations, enabled });
}
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: [...usersKey, query],
    queryFn: () => searchUsers(query),
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
  });
}
export function useCreateDirectConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createDirectConversation,
    onSuccess: () => client.invalidateQueries({ queryKey: conversationsKey }),
  });
}
