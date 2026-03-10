import { createAsyncThunk } from "@reduxjs/toolkit";
import { deleteMessage } from "@/src/feature/messages/model/messagesSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://redchat.space";

export const deleteMessageThunk = createAsyncThunk(
  "message/delete",
  async (messageId: number, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${messageId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Не авторизован");
        }
        if (response.status === 403) {
          throw new Error("Нет прав на удаление этого сообщения");
        }

        const error = await response.json();
        throw new Error(error.error || "Ошибка при удалении сообщения");
      }
      dispatch(deleteMessage(messageId));
      return messageId;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      return rejectWithValue(errorMessage);
    }
  },
);
