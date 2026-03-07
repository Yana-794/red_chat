import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "@/src/feature/auth/model/authSlise";
import messagesSlice from "@/src/feature/messages/model/messagesSlice";

export const rootReducer = combineReducers({
  auth: authSlice,
  message: messagesSlice,
});
