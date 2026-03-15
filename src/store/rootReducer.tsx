import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "@/src/feature/auth/model/authSlise";
import messagesSlice from "@/src/feature/messages/model/messagesSlice";
import chatSlice from "@/src/feature/chat/model/ChatSlise";
import websocketSlice from "@/src/feature/websocket/websocketSlice";
import userSlice from '@/src/entries/user/model/userSlise'

export const rootReducer = combineReducers({
  auth: authSlice,
  message: messagesSlice,
  chat: chatSlice,
  websocket: websocketSlice,
  user: userSlice,
});