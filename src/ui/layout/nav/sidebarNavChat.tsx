import React from "react";
import { Users } from "lucide-react";
import { useRouter, usePathname } from "next/navigation"; 

import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setActiveChat, Chat } from "@/src/feature/chat/model/ChatSlise";

interface SidebarNavChatProps {
  isOpen: boolean;
}

const SidebarNavChat: React.FC<SidebarNavChatProps> = ({ isOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { chats } = useAppSelector((state) => state.chat);

  const handleChatClick = (chat: Chat) => {
    dispatch(setActiveChat(chat));
    router.push(chat.path);
  };

  const isChatActive = (chatPath: string) => {
    return pathname === chatPath;
  };
  return (
    <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => handleChatClick(chat)}
          className={`
              p-3 md:p-4 flex items-center gap-2 md:gap-3 cursor-pointer 
              hover:bg-red-900/20 active:bg-red-900/30 rounded-xl 
              transition-all duration-200 group chat-item
              ${isChatActive(chat.path) ? "bg-red-900/30 border border-red-900/50" : ""}
            `}
        >
          <div className="relative">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:scale-110 transition-transform duration-200">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>

            {chat.online && chat.online > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 border-2 border-[#0a0e27] rounded-full"></span>
            )}
            {chat.unreadCount
              ? chat.unreadCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-red-600 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                    {chat.unreadCount}
                  </span>
                )
              : null}
          </div>
       {isOpen && (  
         <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm md:text-base truncate">
              {chat.name}
            </p>
            <p className="text-gray-400 text-xs md:text-sm truncate hidden md:block">
              {chat.description}
            </p>
               {chat.lastMessage && (
                  <p className="text-gray-500 text-xs truncate hidden md:block">
                    {chat.lastMessage}
                  </p>
                )}
          </div>)}
        </div>
      ))}
    </nav>
  );
};

export default SidebarNavChat;


