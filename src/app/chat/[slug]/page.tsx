"use client";
import React from "react";
import Sidebar from "@/src/ui/layout/nav/sidebar";
import InputMessage from "@/src/ui/layout/chat/inputMessage";
import MessageList from "@/src/ui/layout/chat/chatMessage";
import Header from "@/src/ui/components/header";

const Chat:React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
             <MessageList></MessageList>
            </div>
          <InputMessage />
        
      </div>
    </div>
  );
};

export default Chat;
