import React, { useState } from "react";
import { LogOut, User, Bell, Settings, ChevronDown } from "lucide-react";
import { ENavigationKey, ItemProfile } from "@/src/ui/layout/nav/types";

const PROFILE_ITEMS: ItemProfile[] = [
  {
    key: ENavigationKey.Profile,
    label: "Мой профиль",
    icon: User,
    path: "/profile",
  },
  {
    key: ENavigationKey.Notifications,
    label: "Уведомления",
    icon: Bell,
    path: "/notifications",
  },

  {
    key: ENavigationKey.Settings,
    label: "Настройки",
    icon: Settings,
    path: "/settings",
  },
];
interface Props {
  isOpen: boolean;
}

const SidebarProfil: React.FC<Props> = ({ isOpen }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  return (
    <div className="relative pb-5 pr-2 pl-2 pt-3 flex border-t border-r  border-red-900/30">
      <button
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#0a0e27]/50 border border-red-900/30"
      >
        <div className="w-9 h-9 md:w-10 md:h-10 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/50">
          <User />
        </div>
        {isOpen && (
          <>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-400  text-xs md:text-sm truncate">
                Yana
              </p>
            </div>
            <ChevronDown size={16} color="gray"
            className={`transition-transform duration-300 shrink-0
            ${isProfileMenuOpen ? 'rotate-180': ''}`} />
          </>
        )}
      </button>
      {isProfileMenuOpen && isOpen && (
        <div className="absolute bottom-full mb-3 left-2 right-2  bg-[#0a0e27]/50 border border-red-900/30 rounded-xl shadow-2xl p-2">
          {PROFILE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className="w-full flex items-center gap-3 p-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-red-900/30 hover:rounded-xl"
                  onClick={() => {
                  // Здесь будет навигация
                  console.log(`Navigate to ${item.path}`);
                  setIsProfileMenuOpen(false);
                }}
              
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        className="p-2 md:p-2.5 hover:bg-red-900/30 rounded-xl transition-colors duration-200 group ml-2"
        title="Выход"
      >
        <LogOut className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
      </button>
    </div>
  );
};

export default SidebarProfil;
