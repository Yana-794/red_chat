"use client";
import Logo from "@/src/ui/components/logo";
import SidebarNavChat from "@/src/ui/layout/nav/sidebarNavChat";
import SidebarProfil from "@/src/ui/layout/nav/sidebarProfil";
import { useState } from "react";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <aside
      className={`h-screen sticky top-0 bg-[#0f1422]/95 border-r border-red-900/30 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? "w-72" : "w-30"
      }`}
    >
      <div className="p-4 md:p-6 border-b border-red-900/30 flex items-center justify-between">
        {isSidebarOpen && <Logo />}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-red-900/30 text-white rounded-lg transition-colors ml-auto"
          aria-label={isSidebarOpen ? "Свернуть" : "Развернуть"}
        >
          {isSidebarOpen ? "←" : "→"}
        </button>
      </div>

      {/* Список чатов */}
      <SidebarNavChat isOpen={isSidebarOpen} />

      {/* Профиль пользователя */}
      <SidebarProfil isOpen={isSidebarOpen} />
    </aside>
  );
};

export default Sidebar;