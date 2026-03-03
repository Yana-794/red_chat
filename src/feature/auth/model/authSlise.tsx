import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  username: string;
}

export interface AuthState {
  user: User | null;
  isAuth: boolean;
  isError: boolean;
  errorMessage: string;
}

const initialState: AuthState = {
  user: null,
  isAuth: false,
  isError: false,
  errorMessage: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ username: string }>) {
      state.isAuth = true;
      state.isError = false;
      state.errorMessage = "";
      state.user = {
        username: action.payload.username,
      };
    },

    loginFailure(state, action: PayloadAction<string>) {
      state.isAuth = false;
      state.isError = true;
      state.errorMessage = action.payload;
      state.user = null;
    },

    logout(state) {
      state.isAuth = false;
      state.isError = false;
      state.errorMessage = "";
      state.user = null;
    },

    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});
export const { loginSuccess, loginFailure, logout, updateUser } =
  authSlice.actions;
export default authSlice.reducer;
