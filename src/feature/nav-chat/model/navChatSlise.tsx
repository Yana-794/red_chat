import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Chat {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  path: string;
  online: number | null;
  description: string;
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [
    {
      id: 1,
      name: "Генеральный чат",
      description: "Основной общий чат",
      online: 12,
      path: "/chat/general",
      lastMessage: "Добро пожаловать!",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    },
    {
      id: 2,
      name: "Чат 2",
      description: "общий чат 2",
      online: 5,
      path: "/chat/chat2",
      lastMessage: "Привет всем!",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 2,
    },
    {
      id: 3,
      name: "Чат 3",
      description: "общий чат 3",
      online: 8,
      path: "/chat/chat3",
      lastMessage: "Как дела?",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    },
    {
      id: 4,
      name: "Важное",
      description: "Важное",
      online: 3,
      path: "/chat/important",
      lastMessage: "Обновление системы",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 1,
    },
  ],
  activeChat: null,
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChat(state, action: PayloadAction<Chat>) {
      state.activeChat = action.payload;
      const chat = state.chats.find((c) => c.id === action.payload.id);
      if (chat) {
        chat.unreadCount = 0; // обнуляем счетчик непроситанных
      }
    },
    updateChatLastMessage(
      state,
      action: PayloadAction<{ chatId: number; message: string; time: string }>,
    ) {
      const chat = state.chats.find((c) => c.id === action.payload.chatId); //Находит чат по ID
      if (chat) {
        chat.lastMessage = action.payload.message;
        chat.lastMessageTime = action.payload.time;
        // Увеличиваем счетчик непрочитанных, если чат не активен
        if (state.activeChat?.id !== action.payload.chatId) {
          chat.unreadCount = (chat?.unreadCount || 0) + 1;
        }
      }
    },
    setChats(state, action: PayloadAction<Chat[]>){
        state.chats = action.payload;  // Полная замена массива чатов

    },
    setLoading(state, action: PayloadAction<boolean>){
        state.isLoading = action.payload;  // Установка состояния загрузки

    },

    setError(state, action:PayloadAction<string | null>){
        state.error = action.payload;  // Установка/очистка ошибки
    },
  },
});


export const {setActiveChat, updateChatLastMessage, setChats, setLoading, setError  } = chatSlice.actions
export default chatSlice.reducer