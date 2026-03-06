import { createSlice, PayloadAction,  } from "@reduxjs/toolkit";

interface Chat {
    id: number;
    name: string;
    lastMessage?: string;
    lastMessageTime?: string;
    underCount?: number;
    avatar?: string;
}

interface ChatSlice {
    chats: Chat[];
    activeChatId: number | null;
    error: string | null;
}

const initialState: ChatSlice = {
    chats: [],
    activeChatId: null,
    error: null,

}

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setActiveChat(state, action: PayloadAction<number>){
            state.activeChatId = action.payload
        }
    }
})