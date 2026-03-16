import { createAsyncThunk } from "@reduxjs/toolkit";
import { setUpdateLoading, setError, updateUser } from "./userSlise";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const updateUserProfileThunk = createAsyncThunk(
  "user/updateProfile",
  async (userData: FormData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUpdateLoading(true));
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PUT",
        credentials: "include",
        body: userData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const error = await response.json();
          throw new Error(error.error || "Ошибка обновления профиля");
        }
      }
      const data = await response.json();
      if(data.avatar){
        data.avatar = `${API_BASE_URL}${data.avatar}`
      }
      dispatch(updateUser(data));
      return data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setUpdateLoading(false));
    }
  },
);
