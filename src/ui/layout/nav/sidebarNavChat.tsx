import React from "react";
import { Users, LucideIcon } from "lucide-react";
export interface ChatsItem {
  id: number;
  name: string;
  icon: LucideIcon;
  description: string;
  online: number | null;
}
export const CHAT_ITEM: ChatsItem[] = [
  {
    id: 1,
    name: "Генеральный чат",
    icon: Users,
    description: "Основной общий чат",
    online: 12,
  },
  {
    id: 1,
    name: "Чат 2",
    icon: Users,
    description: "общий чат 2",
    online: 12,
  },
  {
    id: 1,
    name: "Чат 3",
    icon: Users,
    description: "общий чат 3",
    online: 12,
  },
  { id: 1, name: "Важное", icon: Users, description: "Важное", online: 12 },
];

const SidebarNavChat: React.FC = () => {
  return (
    <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
      
        {CHAT_ITEM.map((chat) => (
          <div
            key={chat.id}
            className={`
              p-3 md:p-4 flex items-center gap-2 md:gap-3 cursor-pointer 
              hover:bg-red-900/20 active:bg-red-900/30 rounded-xl 
              transition-all duration-200 group chat-item
            `}
          >
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:scale-110 transition-transform duration-200">
                <chat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 border-2 border-[#0a0e27] rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm md:text-base truncate">
                {chat.name}
              </p>
              <p className="text-gray-400 text-xs md:text-sm truncate hidden md:block">
                {chat.description}
              </p>
            </div>
          </div>
        ))}
      
    </nav>
  );
};

export default SidebarNavChat;


{/* <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2"></div> */}