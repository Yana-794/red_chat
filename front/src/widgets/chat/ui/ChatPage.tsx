"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Settings,
  Send,
  Trash2,
  Paperclip,
  Search,
  Plus,
  Pencil,
  Users,
  FileText,
  Loader2,
  X,
  CircleAlert,
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/model/queries";
import {
  useMessages,
  useCreateMessage,
  useDeleteMessage,
  useUpdateMessage,
  useToggleReaction,
  useUploadConversationFile,
} from "@/features/messages/model/queries";
import { useChatSocket } from "@/features/chat/model/useChatSocket";
import { useConversations, useCreateDirectConversation, useSearchUsers } from "@/features/conversations/model/queries";
import { ProfileModal } from "@/widgets/profile/ui/ProfileModal";
import type { Message } from "@/entities/message/model/types";
import type { Conversation } from "@/entities/conversation/model/types";
import { messagesKeyFor } from "@/features/messages/api/messagesApi";
import { useQueryClient } from "@tanstack/react-query";
import { GiBullHorns } from "react-icons/gi";

const PUBLIC_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function Avatar({
  src,
  name,
  size = "h-9 w-9",
  own = false,
}: {
  src?: string;
  name: string;
  size?: string;
  own?: boolean;
}) {
  return (
    <div
      className={`${size} grid shrink-0 place-items-center overflow-hidden text-[11px] font-bold uppercase tracking-wider ${
        own
          ? "bg-[#E11D48] text-white"
          : "border border-zinc-700 bg-[#27272A] text-zinc-100"
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        name[0]?.toUpperCase() ?? "?"
      )}
    </div>
  );
}

export function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useMe();
  const logout = useLogout();
  const conversationsQuery = useConversations(!!me.data);
  const conversations = conversationsQuery.data ?? [];

  const [conversationId, setConversationId] = useState(PUBLIC_CONVERSATION_ID);
  const selected =
    conversations.find((item) => item.id === conversationId) ?? conversations[0];
  const activeConversationId = selected?.id ?? conversationId;

  const messagesQuery = useMessages(activeConversationId, !!me.data && !!selected);
  const createMessage = useCreateMessage();
  const removeMessage = useDeleteMessage();
  const editMessage = useUpdateMessage();
  const reactToMessage = useToggleReaction();
  const uploadFile = useUploadConversationFile();
  const createDirect = useCreateDirectConversation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [text, setText] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const previousScrollRef = useRef({ height: 0, top: 0 });

  useChatSocket(!!me.data);
  const usersQuery = useSearchUsers(userSearch);

  useEffect(() => {
    if (me.isError) router.replace("/login");
  }, [me.isError, router]);

  useEffect(() => {
    if (conversations.length && !conversations.some((item) => item.id === conversationId)) {
      setConversationId(conversations[0].id);
    }
  }, [conversations, conversationId]);

  useEffect(() => {
    isNearBottomRef.current = true;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversationId]);

  const messages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [messagesQuery.data],
  );

  useEffect(() => {
    if (!isLoadingOlderRef.current && isNearBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleListScroll = () => {
    const element = listRef.current;
    if (!element) return;
    isNearBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  };

  const loadOlderMessages = async () => {
    const element = listRef.current;
    if (!element || !messagesQuery.hasPreviousPage || messagesQuery.isFetchingPreviousPage) return;
    previousScrollRef.current = { height: element.scrollHeight, top: element.scrollTop };
    isLoadingOlderRef.current = true;
    try {
      await messagesQuery.fetchPreviousPage();
    } finally {
      requestAnimationFrame(() => {
        const current = listRef.current;
        if (current)
          current.scrollTop =
            previousScrollRef.current.top +
            (current.scrollHeight - previousScrollRef.current.height);
        isLoadingOlderRef.current = false;
      });
    }
  };

  const resetTextarea = () => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeConversationId) return;
    const content = text.trim();
    if (!content && files.length === 0) return;

    if (content) {
      try {
        await createMessage.mutateAsync({ conversationId: activeConversationId, content });
      } catch {
        return;
      }
    }
    for (const file of files) {
      await uploadFile.mutateAsync({ conversationId: activeConversationId, file });
    }
    setText("");
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
    resetTextarea();
    await queryClient.invalidateQueries({
      queryKey: messagesKeyFor(activeConversationId),
    });
  };

  const onComposerChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(event as unknown as React.FormEvent);
    }
  };

  const startDirect = async (userId: string) => {
    try {
      const conversation = await createDirect.mutateAsync(userId);
      setConversationId(conversation.id);
      setUserSearch("");
      setSearchOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch {
      /* error shown in search panel */
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setConversationId(conversation.id);
    setSearchOpen(false);
  };

  const handleEdit = async (message: Message) => {
    const value = window.prompt("Изменить сообщение", message.content);
    if (value === null || value.trim() === "" || value === message.content) return;
    await editMessage.mutateAsync({ id: message.id, content: value });
  };

  const handleDelete = async (message: Message) => {
    if (!window.confirm("Удалить сообщение?")) return;
    await removeMessage.mutateAsync({
      id: message.id,
      conversationId: message.conversation_id,
    });
  };

  if (me.isLoading || !me.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0A0A0A] text-zinc-500">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
          <Loader2 size={14} className="animate-spin text-[#E11D48]" />
          Checking session
        </div>
      </main>
    );
  }

  const conversationTitle =
    selected?.kind === "public"
      ? "Общий чат"
      : selected?.other_username || selected?.title || "Личный диалог";

  const composerError =
    createMessage.error ||
    uploadFile.error ||
    editMessage.error ||
    removeMessage.error ||
    reactToMessage.error;

  return (
    <main className="relative flex h-screen overflow-hidden bg-[#0A0A0A] text-zinc-100">
      {/* top glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-180 -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.12),transparent_70%)]" />

      <aside className="relative z-10 flex w-72 shrink-0 flex-col border-r border-zinc-800 bg-[#0A0A0A]">
        {/* brand */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4">
          <div className="relative grid h-10 w-10 place-items-center border border-zinc-800 bg-[#18181B] text-[#E11D48]">
<GiBullHorns className="h-5 w-5" aria-hidden />
        <span className="absolute -right-px -top-px h-2 w-2 bg-[#E11D48]" aria-hidden />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white">
              Red<span className="text-[#E11D48]">Chat</span>
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
              // 2026 · beta
            </p>
          </div>
        </div>

        {/* dialogs header */}
        <div className="flex items-center justify-between px-4 pb-2 pt-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
            // Dialogs
          </span>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="grid h-7 w-7 place-items-center border border-zinc-800 text-zinc-400 transition hover:border-[#E11D48] hover:text-[#E11D48]"
            title="Новый диалог"
            aria-label="Новый диалог"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* search */}
        {searchOpen && (
          <div className="px-3 pb-3">
            <div className="flex items-center border border-zinc-800 bg-[#18181B]">
              <span className="pl-2.5 text-zinc-500">
                <Search size={13} />
              </span>
              <input
                autoFocus
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Найти пользователя"
                className="w-full bg-transparent px-2 py-2 text-[13px] outline-none placeholder:text-zinc-600"
              />
            </div>
            {userSearch.trim().length >= 2 && (
              <div className="mt-1 max-h-48 overflow-y-auto border border-zinc-800 bg-[#18181B]">
                {usersQuery.data?.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startDirect(user.id)}
                    className="flex w-full items-center gap-2 border-l-2 border-l-transparent px-2 py-2 text-left transition hover:border-l-[#E11D48] hover:bg-[#141416]"
                  >
                    <Avatar src={user.avatar_url} name={user.username} size="h-7 w-7" />
                    <span className="text-sm text-zinc-200">{user.username}</span>
                  </button>
                ))}
                {usersQuery.isLoading && (
                  <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
                    Searching…
                  </p>
                )}
                {usersQuery.data?.length === 0 && !usersQuery.isLoading && (
                  <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
                    No users found
                  </p>
                )}
                {createDirect.error && (
                  <p className="px-2 py-1.5 text-[11px] text-[#E11D48]">
                    {createDirect.error.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* conversations */}
        <nav className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const title =
              conversation.kind === "public"
                ? "Общий чат"
                : conversation.other_username || conversation.title;
            const avatar =
              conversation.kind === "public"
                ? undefined
                : conversation.other_avatar_url;
            const active = activeConversationId === conversation.id;
            return (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={`group flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left transition ${
                  active
                    ? "border-l-[#E11D48] bg-[#18181B]"
                    : "border-l-transparent hover:border-l-zinc-700 hover:bg-[#141416]"
                }`}
              >
                {conversation.kind === "public" ? (
                  <div className="grid h-9 w-9 shrink-0 place-items-center border border-[#E11D48]/40 bg-[#E11D48]/10 text-[#E11D48]">
                    <Users size={16} />
                  </div>
                ) : (
                  <Avatar src={avatar} name={title} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold tracking-tight text-zinc-100">
                    {title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                    {conversation.last_message ||
                      (conversation.kind === "public"
                        ? "Общение со всеми"
                        : "Личный диалог")}
                  </span>
                </span>
                {active && (
                  <span className="h-1.5 w-1.5 shrink-0 bg-[#E11D48]" aria-hidden />
                )}
              </button>
            );
          })}
          {conversationsQuery.isLoading && (
            <p className="px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500">
              Loading dialogs…
            </p>
          )}
        </nav>

        {/* self bar */}
        <div className="flex items-center gap-3 border-t border-zinc-800 px-3 py-3">
          <Avatar src={me.data.avatar_url} name={me.data.username} own />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold tracking-tight text-white">
              {me.data.username}
            </p>
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
              <span className="h-1.5 w-1.5 bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
              Online
            </p>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            className="grid h-8 w-8 place-items-center text-zinc-400 transition hover:text-[#E11D48]"
            title="Профиль"
            aria-label="Профиль"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => logout.mutate()}
            className="grid h-8 w-8 place-items-center text-zinc-400 transition hover:text-[#E11D48]"
            title="Выйти"
            aria-label="Выйти"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <section className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="flex items-center gap-3 border-b border-zinc-800 bg-[#0A0A0A]/80 px-4 py-3.5 backdrop-blur md:px-8">
          {selected?.kind === "public" ? (
            <div className="relative grid h-10 w-10 place-items-center border border-[#E11D48]/40 bg-[#E11D48]/10 text-[#E11D48]">
              <GiBullHorns className="h-5 w-5" aria-hidden />
              <span className="absolute -right-px -top-px h-2 w-2 bg-[#E11D48]" aria-hidden />
            </div>
          ) : (
            <Avatar src={selected?.other_avatar_url} name={conversationTitle} />
          )}
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-bold tracking-tight text-white">
              {conversationTitle}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              <span className="h-1.5 w-1.5 bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
              {selected?.kind === "public" ? "Public · Live" : "Direct · Encrypted"}
            </p>
          </div>
        </header>

        {/* messages */}
        <div
          ref={listRef}
          onScroll={handleListScroll}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-8 md:py-6"
        >
          {messagesQuery.hasPreviousPage && (
            <div className="flex justify-center py-2">
              <button
                onClick={loadOlderMessages}
                disabled={messagesQuery.isFetchingPreviousPage}
                className="border border-zinc-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition hover:border-[#38BDF8] hover:text-[#38BDF8] disabled:opacity-40"
              >
                {messagesQuery.isFetchingPreviousPage ? "Loading…" : "Load previous"}
              </button>
            </div>
          )}

          {messagesQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Loader2 size={13} className="animate-spin text-[#E11D48]" />
              Loading messages
            </div>
          )}

          {!messagesQuery.isLoading && messages.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-14 w-14 place-items-center border border-zinc-800 bg-[#18181B] text-[#E11D48]">
<GiBullHorns   />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300">
                  No messages
                </p>
                <p className="text-[11px] text-zinc-500">Начните общение первым</p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const own = message.sender_id === me.data.id;
            return (
              <article
                key={message.id}
                className={`group flex items-start gap-3 ${own ? "flex-row-reverse" : ""}`}
              >
                <Avatar
                  src={own ? me.data.avatar_url : message.avatar_url}
                  name={own ? me.data.username : message.username}
                  size="h-8 w-8"
                  own={own}
                />
                <div
                  className={`max-w-[min(82%,42rem)] border border-zinc-800 bg-[#18181B] px-4 py-2.5 ${
                    own
                      ? "border-r-2 border-r-[#E11D48]"
                      : "border-l-2 border-l-[#38BDF8]"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                        own ? "text-[#E11D48]" : "text-[#38BDF8]"
                      }`}
                    >
                      {own ? "You" : message.username}
                    </span>
                    <time className="text-[10px] tabular-nums text-zinc-500">
                      {new Date(message.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {message.edited_at && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                        edited
                      </span>
                    )}
                    {own && (
                      <span className="ml-auto flex gap-0.5 opacity-60 transition group-hover:opacity-100">
                        <button
                          onClick={() => handleEdit(message)}
                          className="grid h-5 w-5 place-items-center text-zinc-400 transition hover:bg-[#E11D48]/10 hover:text-[#E11D48]"
                          title="Редактировать"
                          aria-label="Редактировать"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => handleDelete(message)}
                          className="grid h-5 w-5 place-items-center text-zinc-400 transition hover:bg-[#E11D48]/10 hover:text-[#E11D48]"
                          title="Удалить"
                          aria-label="Удалить"
                        >
                          <Trash2 size={11} />
                        </button>
                      </span>
                    )}
                  </div>

                  {message.content && (
                    <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-zinc-100">
                      {message.content}
                    </p>
                  )}

                  {message.attachments?.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-2 border border-zinc-800 bg-[#0A0A0A] px-2.5 py-2 text-[12px] text-[#38BDF8] transition hover:border-[#38BDF8]/50"
                    >
                      <FileText size={15} className="shrink-0" />
                      <span className="max-w-64 truncate">{attachment.original_name}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-500">
                        {Math.max(1, Math.round(attachment.size_bytes / 1024))} KB
                      </span>
                    </a>
                  ))}

                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {message.reactions?.map((reaction) => (
                      <button
                        key={reaction.emoji}
                        onClick={() =>
                          reactToMessage.mutate({
                            id: message.id,
                            emoji: reaction.emoji,
                            conversationId: activeConversationId,
                          })
                        }
                        className={`border px-1.5 py-0.5 text-[11px] transition ${
                          reaction.reacted_by_me
                            ? "border-[#E11D48] bg-[#E11D48]/10 text-[#E11D48]"
                            : "border-zinc-800 bg-[#0A0A0A] text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {reaction.emoji} {reaction.count}
                      </button>
                    ))}
                    <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                      {REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() =>
                            reactToMessage.mutate({
                              id: message.id,
                              emoji,
                              conversationId: activeConversationId,
                            })
                          }
                          className="px-1 py-0.5 text-xs transition hover:bg-[#E11D48]/10"
                          title={`Реакция ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* composer */}
        <form
          onSubmit={submit}
          className="border-t border-zinc-800 bg-[#0A0A0A] px-3 py-3 md:px-8 md:py-4"
        >
          {files.length > 0 && (
            <div className="mx-auto mb-2 flex max-w-5xl flex-wrap gap-1.5">
              {files.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-1.5 border border-zinc-800 bg-[#18181B] px-2 py-1 text-[11px] text-zinc-300"
                >
                  <span className="max-w-48 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((current) => current.filter((_, i) => i !== index))
                    }
                    className="text-[#E11D48] transition hover:text-[#F43F5E]"
                    aria-label={`Убрать ${file.name}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mx-auto flex max-w-5xl items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Прикрепить файл"
              aria-label="Прикрепить файл"
              className="grid h-11 w-11 shrink-0 place-items-center border border-zinc-800 text-zinc-400 transition hover:border-[#38BDF8] hover:text-[#38BDF8]"
            >
              <Paperclip size={17} />
            </button>
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={onComposerChange}
              onKeyDown={onComposerKeyDown}
              maxLength={2000}
              placeholder="Напишите сообщение…"
              className="max-h-40 min-h-11 w-full resize-none border border-zinc-800 bg-[#18181B] px-3.5 py-3 text-sm leading-5 text-white placeholder:text-zinc-600 outline-none transition focus:border-[#E11D48]"
            />
            <button
              type="submit"
              disabled={
                (!text.trim() && files.length === 0) ||
                createMessage.isPending ||
                uploadFile.isPending
              }
              className="grid h-11 w-11 shrink-0 place-items-center bg-[#E11D48] text-white transition hover:bg-[#F43F5E] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Отправить"
            >
              <Send size={17} />
            </button>
          </div>

          {composerError && (
            <p className="mx-auto mt-2 flex max-w-5xl items-center gap-1.5 text-[11px] text-[#E11D48]">
              <CircleAlert size={11} />
              {composerError.message}
            </p>
          )}
        </form>
      </section>

      {profileOpen && (
        <ProfileModal user={me.data} onClose={() => setProfileOpen(false)} />
      )}
    </main>
  );
}