import { createAsyncThunk } from "@reduxjs/toolkit";
import { updateUser } from "./authSlise";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const getUserInfoThunk = createAsyncThunk(
  "auth/getUserInfo",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status == 401) {
          throw new Error("Не авторизован");
        }
        throw new Error("Ошибка получения информации о пользователе");
      }

      const userData = await response.json();
      dispatch(updateUser(userData));
      return userData;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      return rejectWithValue(errorMessage);
    }
  },
);
