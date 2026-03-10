'use client'
import React from "react";
import { useAppSelector } from "@/src/store/hooks";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { status } = useAppSelector((state) => state.websocket);
  const { currentChat } = useAppSelector((state) => state.chat);

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Подключено";
      case "connecting":
        return "Подключение...";
      default:
        return "Отключено";
    }
  };

  return (
    <header className="p-4 border-b border-red-900/30 bg-[#0a0e27]/40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            {title || currentChat?.name || "Чат"}
          </h1>
          <p className="text-sm text-gray-400">
            {currentChat?.description || "Общий чат"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-xs text-gray-400">{getStatusText()}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;