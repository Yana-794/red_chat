import { combineReducers } from "@reduxjs/toolkit";
import authSlice from '@/src/feature/auth/model/authSlise'

export const rootReducer = combineReducers({
      auth: authSlice,

})