import { createAsyncThunk } from "@reduxjs/toolkit";
import { checkAuthSuccess, logout } from "./authSlise";

export const checkAuthThunk = createAsyncThunk(
  "auth/check",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Используем /api/me для получения данных пользователя
      const response = await fetch("http://localhost:8080/api/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        console.log("🔴 Пользователь не авторизован");
        dispatch(logout());
        return rejectWithValue("Not authenticated");
      }

      if (!response.ok) {
        throw new Error("Failed to check auth");
      }

      const userData = await response.json();
      console.log("✅ Пользователь авторизован:", userData);
      
      // Сохраняем username в localStorage для других компонентов
      localStorage.setItem("username", userData.username);
      
      dispatch(checkAuthSuccess({
        id: userData.id,
        username: userData.username
      }));

      return { authenticated: true, user: userData };
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      dispatch(logout());
      return rejectWithValue("Auth check failed");
    }
  }
);