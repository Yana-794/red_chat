import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: number;
  username: string;
  description?: string;
  avatar?: string;
}

export interface UserState {
  user: User | null;
  error: string | null;
  updateLoading: boolean;
}

const initialState: UserState = {
  user: null,
  error: null,
  updateLoading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.error = null;
    },

    setUpdateLoading: (state, action: PayloadAction<boolean>) => {
      state.updateLoading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.updateLoading = false;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});
export const {
  setUser,

  setUpdateLoading,
  setError,
  updateUser,
} = userSlice.actions;
export default userSlice.reducer;
