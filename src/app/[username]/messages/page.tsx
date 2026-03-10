"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { messagesThunk } from "@/src/feature/messages/model/messagesThunk";
import { websocketService } from "@/src/feature/websocket/websocketService";
import { setConnectionStatus } from "@/src/feature/websocket/websocketSlice";
import { resetUnread } from "@/src/feature/chat/model/ChatSlise";
import Sidebar from "@/src/ui/layout/nav/sidebar";
import InputMessage from "@/src/ui/layout/chat/inputMessage";
import MessageList from "@/src/ui/layout/chat/chatMessage";
import Header from "@/src/ui/components/header";

export default function UserMessagesPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { isAuth } = useAppSelector((state) => state.auth);
  const username = params.username;

  useEffect(() => {
    // Проверяем, что username в URL совпадает с текущим пользователем
    if (!isAuth) {
      router.push('/login');
      return;
    }

    // Загружаем сообщения
    dispatch(messagesThunk(50));
    
    // Подключаемся к WebSocket
    websocketService.connect(dispatch);

    // Сбрасываем счетчик непрочитанных при заходе в чат
    dispatch(resetUnread());

    return () => {
      websocketService.disconnect();
      dispatch(setConnectionStatus('disconnected'));
    };
  }, [dispatch, isAuth, router, username]);

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