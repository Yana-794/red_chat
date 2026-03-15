import { createAsyncThunk } from "@reduxjs/toolkit";
import { setUser, setError } from "./userSlise";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const getCurrentUserThunk = createAsyncThunk(
  "user/getCurrent",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if(!response.ok){
        if(response.status === 401){
            throw new Error ("Не авторизован")
        }
        const error = await response.json();
        throw new Error( error.error ||  "Ошибка загрузки пользователя" )
      }
      const data = await response.json();
      dispatch(setUser(data))
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } 
  },
);
