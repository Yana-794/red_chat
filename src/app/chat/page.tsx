"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { messagesThunk } from "@/src/feature/messages/model/messagesThunk";
import { websocketService } from "@/src/feature/websocket/websocketService";
import { setConnectionStatus } from "@/src/feature/websocket/websocketSlice";
import { resetUnread } from "@/src/feature/chat/model/ChatSlise";
import Sidebar from "@/src/ui/layout/nav/sidebar";
import InputMessage from "@/src/feature/chat/ui/inputMessage";
import MessageList from "@/src/feature/messages/ui/chatMessage";
import Header from "@/src/ui/components/header";

export default function UserMessagesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuth, user } = useAppSelector((state) => state.auth);
  
  // Используем ref для отслеживания инициализации
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuth) {
      router.push('/login');
    }
  }, [isAuth, router]);

  useEffect(() => {
    if (!isAuth) return;

    // Загружаем сообщения только один раз
    if (!initialized.current) {
      initialized.current = true;
      
      console.log("Initializing chat...");
      dispatch(messagesThunk(50));
      dispatch(resetUnread());
      
      // Подключаем WebSocket
      websocketService.connect(dispatch);
    }

    return () => {
      console.log("Cleaning up WebSocket...");
      websocketService.disconnect();
      dispatch(setConnectionStatus('disconnected'));
      initialized.current = false;
    };
  }, [dispatch, isAuth]);
 

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <p className="text-gray-400">Пользователь не авторизован</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header title={`Привет, ${user.username}!`} />
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <MessageList />
        </div>
        <InputMessage />
      </div>
    </div>
  );
}