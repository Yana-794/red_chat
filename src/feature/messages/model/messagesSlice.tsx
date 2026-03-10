import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Message {
  id: number;
  secondId: number;
  username: string;
  content: string;
  createdAd: string;
}

interface MessagesState {
  messages: Message[];
  error: string | null;
  isLoading: boolean;
  hasMore: boolean;
}

const initialState: MessagesState = {
  messages: [],
  error: null,
  isLoading: false,
  hasMore: true,
};

const messagesSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
      state.hasMore = action.payload.length === 50;
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },
    addMessages(state, action: PayloadAction<Message[]>) {
      state.messages = [...action.payload, ...state.messages];
    },
    deleteMessage(state, action: PayloadAction<number>) {
      state.messages = state.messages.filter(
        (msg) => msg.id !== action.payload,
      );
    },
    updateMessage(state, action: PayloadAction<Message>){
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if(index != -1){
        state.messages[index] = action.payload
      }
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
      state.hasMore = true;
    },
  },
});

export const {
  setMessages,
  addMessage,
  addMessages,
  deleteMessage,
  updateMessage,
  setError,
  setLoading,
  clearMessages,
} = messagesSlice.actions;
export default messagesSlice.reducer;
