import { createAsyncThunk } from "@reduxjs/toolkit";
import { checkAuthSuccess, logout } from "./authSlise";

export const checkAuthThunk = createAsyncThunk(
  "auth/check",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch("https://redchat.space/api/messages?limit=1", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        dispatch(logout());
        return rejectWithValue("Not authenticated");
      }

      if (!response.ok) {
        throw new Error("Failed to check auth");
      }

      // Пытаемся получить информацию о пользователе из куки или отдельного эндпоинта
      // Если нет отдельного эндпоинта, можно сохранить username из localStorage
      const username = localStorage.getItem("username");
      if (username) {
        dispatch(checkAuthSuccess({ username }));
      }

      return { authenticated: true };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      dispatch(logout());
      return rejectWithValue("Auth check failed");
    }
  }
);