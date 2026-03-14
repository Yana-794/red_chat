import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginSuccess, loginFailure, logout } from "@/src/feature/auth/model/authSlise";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    payload: { username: string; password: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
       throw new Error(error.message || 'Login failed')
      }

      const data = await response.json();
      dispatch(
        loginSuccess({
          username: data.username,
          id: data.id
        }),
      );
      return data;
    } catch (error: unknown) {

        dispatch(logout())
        if(error instanceof Error){
            dispatch(loginFailure(error.message))
            return rejectWithValue(error.message)
        }
        return rejectWithValue('Unknown error')
      
    }
  },
);
