"use client";
import React from "react";
import { MessageCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/src/store/hooks";

interface SidebarNavChatProps {
  isOpen: boolean;
}

const SidebarNavChat: React.FC<SidebarNavChatProps> = ({ isOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentChat } = useAppSelector((state) => state.chat);

  if (!currentChat) return null;

  const isActive = pathname === currentChat.path;

  const handleClick = () => {
    router.push(currentChat.path);
  };

  return (
    <nav className="flex-1 px-4 py-4">
      <div
        onClick={handleClick}
        className={`
          p-3 md:p-4 flex items-center gap-2 md:gap-3 cursor-pointer 
          hover:bg-red-900/20 active:bg-red-900/30 rounded-xl 
          transition-all duration-200 group chat-item
          ${isActive ? "bg-red-900/30 border border-red-900/50" : ""}
        `}
      >
        <div className="relative">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:scale-110 transition-transform duration-200">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0a0e27] rounded-full"></span>
          {currentChat.unreadCount ? currentChat.unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 bg-red-600 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1">
              {currentChat.unreadCount}
            </span>
          ) : null}
        </div>
        
        {isOpen && (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm md:text-base truncate">
              {currentChat.name}
            </p>
            <p className="text-gray-400 text-xs md:text-sm truncate">
              {currentChat.description}
            </p>
            {currentChat.lastMessage && (
              <p className="text-gray-500 text-xs truncate">
                {currentChat.lastMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default SidebarNavChat;