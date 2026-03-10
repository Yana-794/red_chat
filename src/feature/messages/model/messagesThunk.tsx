'use client'
import { createAsyncThunk } from "@reduxjs/toolkit";
import {  addMessages, setError, setLoading, setMessages } from "./messagesSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const messagesThunk = createAsyncThunk(
  "messages/fetch",
  async (limit: number = 50, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const response = await fetch(
       `${API_BASE_URL}/api/messages?limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if(!response.ok){
        if(response.status === 401){
            throw new Error('Не авторизован')
        }
        const error = await response.json();
        throw new Error(error.error || 'Ошибка загрузки сообщений')
      }
      const data = await response.json();
      dispatch(setMessages(data));
      return data;
    } catch (error: unknown){
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
        dispatch(setError(errorMessage));
        return rejectWithValue(errorMessage)

    }finally{
        dispatch(setLoading(false))
    }
  },
);

export const olderMessagesThunk = createAsyncThunk(
    'messages/older',
     async ({ limit = 50, beforeId }: { limit?: number; beforeId?: number }, { dispatch, rejectWithValue }) => {
        try{
           dispatch(setLoading(true));
           const url = beforeId
           ? `${API_BASE_URL}/api/messages?limit=${limit}&before=${beforeId}`
           : `${API_BASE_URL}/api/messages?limit=${limit}` ;
           const response = await fetch(url, {
            method: 'GET',
            credentials:'include',
            headers: { 'Content-Type': 'application/json' }
           });
           if(!response.ok){
            if(response.status === 401){
                throw new Error ("Не фвторизован");
            }
            const error = await response.json();
            throw new Error (error.erorr || 'Ошибка загрузки сообщений')
           }
           const data = await response.json();
           dispatch(addMessages(data))
           return data
        }catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally{
        dispatch(setLoading(false))
    }
     }
)