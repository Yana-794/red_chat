import React, { useState } from "react";
import { LogOut, User, Bell, Settings, ChevronDown } from "lucide-react";
import { ENavigationKey, ItemProfile } from "@/src/ui/layout/nav/types";
import { useRouter } from "next/navigation"; 
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/feature/auth/model/authSlise";
import UserProfileModal  from "@/src/entries/user/ui/userProfil";
import Image from 'next/image';


const PROFILE_ITEMS: ItemProfile[] = [
  {
    key: ENavigationKey.Profile,
    label: "Мой профиль",
    icon: User,
    path: "#",
     isModal: true,
  },
  // {
  //   key: ENavigationKey.Notifications,
  //   label: "Уведомления",
  //   icon: Bell,
  //   path: "/notifications",
   
  // },
  // {
  //   key: ENavigationKey.Settings,
  //   label: "Настройки",
  //   icon: Settings,
  //   path: "/settings",
  // },
];

interface Props {
  isOpen: boolean;
}

const SidebarProfil: React.FC<Props> = ({ isOpen }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const { user: profileUser } = useAppSelector((state) => state.user);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsProfileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsProfileMenuOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  const userName = authUser?.username || "Пользователь";
const userAvatar = profileUser?.avatar || authUser?.avatar;
  return (
    <>
      <div className="relative pb-5 px-2 pt-3 border-t border-red-900/30">
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#0a0e27]/50 border border-red-900/30 hover:bg-red-900/20 transition-colors"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/50 shrink-0">
            {userAvatar? (
              <Image  
                src={userAvatar} 
                alt={userName} 
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-xl"
                unoptimized 
              />
            ) : (
              <User size={18} />
            )}
          </div>

          {isOpen && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-white text-xs md:text-sm truncate">
                  {userName}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-300 shrink-0 ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>

        {/* Выпадающее меню */}
        {isProfileMenuOpen && isOpen && (
          <div className="absolute bottom-full mb-2 left-2 right-2 bg-[#0f1422] border border-red-900/30 rounded-xl shadow-2xl py-1 z-50">
            {PROFILE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.isModal) {
                      handleProfileClick();
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-red-900/30 transition-colors"
                >
                  <Icon size={16} className="text-gray-400" />
                  {item.label}
                </button>
              );
            })}

            <div className="border-t border-red-900/30 my-1"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
            >
              <LogOut size={16} />
              Выйти
            </button>
          </div>
        )}

        {!isOpen && (
          <button
            onClick={handleLogout}
            className="w-full mt-2 p-2 hover:bg-red-900/30 rounded-xl transition-colors duration-200 group flex justify-center"
            title="Выход"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
          </button>
        )}
      </div>
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default SidebarProfil;