import { createAsyncThunk } from "@reduxjs/toolkit";
import { logout } from "./authSlise";

export const logoutThink = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await fetch("http://localhost:8080/api/logout", {
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
