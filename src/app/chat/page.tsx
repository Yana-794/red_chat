"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { messagesThunk } from "@/src/feature/messages/model/messagesThunk";
import { websocketService } from "@/src/feature/websocket/websocketService";
import { setConnectionStatus } from "@/src/feature/websocket/websocketSlice";
import { resetUnread } from "@/src/feature/chat/model/ChatSlise";
import Sidebar from "@/src/ui/layout/nav/sidebar";
import InputMessage from "@/src/feature/chat/ui/inputMessage";
import MessageList from "@/src/ui/layout/chat/chatMessage";
import Header from "@/src/ui/components/header";

export default function UserMessagesPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { isAuth } = useAppSelector((state) => state.auth);
  const username = params.username;
  
  // Флаг для отслеживания первого рендера
  
  // Отдельный эффект для редиректа (без зависимостей от router в основном эффекте)
  useEffect(() => {
    if (!isAuth) {
      router.push('/login');
    }
  }, [isAuth, router]); // router остается только здесь!

  // Основной эффект для загрузки данных и WebSocket
  useEffect(() => {
    // Не продолжаем, если не авторизован
    if (!isAuth) return;

    console.log("🟢 Настройка WebSocket и загрузка сообщений");

    // Загружаем сообщения
    dispatch(messagesThunk(50));
    dispatch(resetUnread());

    // Подключаемся к WebSocket ТОЛЬКО если еще не подключены
    if (!websocketService.isConnected()) {
      websocketService.connect(dispatch);
    } else {
      console.log("WebSocket уже подключен, пропускаем...");
    }

    // Очистка при размонтировании
    return () => {
      console.log("🔴 Очистка WebSocket соединения");
      websocketService.disconnect();
      dispatch(setConnectionStatus('disconnected'));
    };
  // ✅ Убираем router из зависимостей!
  }, [dispatch, isAuth, username]); // Только нужные зависимости

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header title={`Привет, ${username}!`} />
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <MessageList />
        </div>
        <InputMessage />
      </div>
    </div>
  );
}