"use client";
import Logo from "@/src/ui/components/logo";
import SidebarNavChat from "@/src/ui/layout/nav/sidebarNavChat";
import SidebarProfil from "@/src/ui/layout/nav/sidebarProfil";
import { useState } from "react";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const asideWidthClass = isSidebarOpen ? "w-72" : "w-20";
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <aside
      className={`h-screen sticky top-0 bg-[#0f1422]/95 border-r  border-red-900/30 flex flex-col transition-transform duration-300 ${asideWidthClass}
      `}
    >
      <div className="p-4 md:p-6 border-b border-red-900/30">
        <Logo />
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-red-900/30 rounded-lg transition-colors"
        >
          {isSidebarOpen ? "←" : "→"}
        </button>
      </div>

      {/* Список чатов */}
      <SidebarNavChat />

      {/* Профиль пользователя */}
      <SidebarProfil isOpen={isSidebarOpen} />
    </aside>
  );
};

export default Sidebar;
