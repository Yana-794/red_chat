"use client";
import React, { useEffect } from "react";
import Sidebar from "@/src/ui/layout/nav/sidebar";
import InputMessage from "@/src/ui/layout/chat/inputMessage";
import MessageList from "@/src/ui/layout/chat/chatMessage";
import Header from "@/src/ui/components/header";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { messagesThunk } from "@/src/feature/messages/model/messagesThunk";
import { websocketService } from "@/src/feature/websocket/websocketService";
import { setConnectionStatus } from "@/src/feature/websocket/websocketSlice";

const Chat:React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {isAuth} = useAppSelector((state) => state.auth);
  const {status} = useAppSelector((state) => state.websocket)

  useEffect(() => {
    // if(!isAuth){
    //   router.push('/login')
    //   return
    // }
    dispatch(messagesThunk(50))
    websocketService.connect(dispatch)

    return() => {
      websocketService.disconnect();
      dispatch(setConnectionStatus('disconnected'))
    }
  }, [isAuth, dispatch, router])
  return (
     <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <MessageList />
        </div>
        
        <InputMessage />
      </div>
    </div>
  );
};

export default Chat;
