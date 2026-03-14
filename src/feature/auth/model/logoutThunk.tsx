import { createAsyncThunk } from "@reduxjs/toolkit";
import { logout } from "./authSlise";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const logoutThink = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      dispatch(logout());
    }
  },
);
