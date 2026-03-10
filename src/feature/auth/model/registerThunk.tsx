import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginSuccess,
  loginFailure,
  logout,
} from "@/src/feature/auth/model/authSlise";

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    payload: { username: string; password: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      dispatch(loginSuccess({ username: data.username }));
      return data;
    } catch (error: unknown) {
        dispatch(logout());
        if(error instanceof Error){
            dispatch(loginFailure(error.message))
            return rejectWithValue(error.message)
        }
        return rejectWithValue('Unknown error')
    }
  },
);
