
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Chat {
  id: number;
  name: string;
  description: string;
  path: string;
  // Для общего чата всегда один
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface ChatState {
  currentChat: Chat | null; // Только текущий чат (общий)
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  currentChat: {
    id: 1,
    name: "Общий чат",
    description: "Основной чат приложения",
    path: "/chat",
    unreadCount: 0,
  },
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentChat(state, action: PayloadAction<Chat>) {
      state.currentChat = action.payload;
    },
    updateLastMessage(
      state,
      action: PayloadAction<{ message: string; time: string }>
    ) {
      if (state.currentChat) {
        state.currentChat.lastMessage = action.payload.message;
        state.currentChat.lastMessageTime = action.payload.time;
      }
    },
    incrementUnread(state) {
      if (state.currentChat) {
        state.currentChat.unreadCount = (state.currentChat.unreadCount || 0) + 1;
      }
    },
    resetUnread(state) {
      if (state.currentChat) {
        state.currentChat.unreadCount = 0;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentChat,
  updateLastMessage,
  incrementUnread,
  resetUnread,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;