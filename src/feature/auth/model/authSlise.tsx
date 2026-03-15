import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: number;
  username: string;
   description?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuth: boolean;
  isError: boolean;
  isLoading: boolean;
  errorMessage: string;
}

const initialState: AuthState = {
  user: null,
  isAuth: false,
  isLoading: false,
  isError: false,
  errorMessage: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    loginSuccess(state, action: PayloadAction<{ username: string, id: number }>) {
      state.isAuth = true;
      state.isError = false;
      state.isLoading = false;
      state.errorMessage = "";
      state.user = {
        username: action.payload.username,
        id: action.payload.id,
      };
    },

    loginFailure(state, action: PayloadAction<string>) {
      state.isAuth = false;
      state.isError = true;
      state.isLoading = false;

      state.errorMessage = action.payload;
      state.user = null;
    },

    logout(state) {
      state.isAuth = false;
      state.isError = false;
      state.isLoading = false;
      state.errorMessage = "";
      state.user = null;
    },

    checkAuthSuccess(state, action: PayloadAction<{ username: string; id: number }>) {
      state.isAuth = true;
      state.user ={
        id: action.payload.id,
        username: action.payload.username,
      }
    },
    updateUser(state, action: PayloadAction<{ username: string; id: number }>){
      state.user = {
        id: action.payload.id,
        username: action.payload.username
      }
    }
  },
});
export const { loginSuccess, loginFailure, logout, checkAuthSuccess, setLoading, updateUser } =
  authSlice.actions;
export default authSlice.reducer;
