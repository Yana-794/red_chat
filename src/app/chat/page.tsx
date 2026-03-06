"use client";
import React from "react";
import Sidebar from "@/src/ui/layout/nav/sidebar";
import Header from "@/src/ui/components/header";

const Chat:React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
      </div>
    </div>
  );
};

export default Chat;
