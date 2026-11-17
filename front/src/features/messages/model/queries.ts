import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createMessage,
  deleteMessage,
  getMessages,
  messagesKey,
  messagesKeyFor,
  toggleReaction,
  updateMessage,
  uploadConversationFile,
} from "@/features/messages/api/messagesApi";

export function useMessages(conversationId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: messagesKeyFor(conversationId),
    queryFn: ({ pageParam }) => getMessages(conversationId, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (firstPage: Awaited<ReturnType<typeof getMessages>>) =>
      firstPage.has_more ? firstPage.next_before_id ?? undefined : undefined,
    enabled: Boolean(conversationId) && enabled,
  });
}

export function useCreateMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      createMessage(conversationId, content),
    onSuccess: (_, variables) =>
      client.invalidateQueries({ queryKey: messagesKeyFor(variables.conversationId) }),
  });
}

export function useUploadConversationFile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, file }: { conversationId: string; file: File }) =>
      uploadConversationFile(conversationId, file),
    onSuccess: (_, variables) =>
      client.invalidateQueries({ queryKey: messagesKeyFor(variables.conversationId) }),
  });
}

export function useUpdateMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => updateMessage(id, content),
    onSuccess: (message) =>
      client.invalidateQueries({ queryKey: messagesKeyFor(message.conversation_id) }),
  });
}

export function useDeleteMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; conversationId: string }) => deleteMessage(id),
    onSuccess: (_, variables) =>
      client.invalidateQueries({ queryKey: messagesKeyFor(variables.conversationId) }),
  });
}

export function useToggleReaction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, emoji }: { id: number; emoji: string; conversationId: string }) =>
      toggleReaction(id, emoji),
    onSuccess: (_, variables) =>
      client.invalidateQueries({ queryKey: messagesKeyFor(variables.conversationId) }),
  });
}

export function useInvalidateAllMessageLists() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: messagesKey });
}
