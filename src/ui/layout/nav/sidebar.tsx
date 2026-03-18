"use client";
import Logo from "@/src/ui/components/logo";
import SidebarNavChat from "@/src/ui/layout/nav/sidebarNavChat";
import SidebarProfil from "@/src/ui/layout/nav/sidebarProfil";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Menu, MessageCircle } from "lucide-react";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      
      <button 
        className="fixed top-4 left-4 z-40 md:hidden p-3 bg-[#0f1422] border border-red-900/30 rounded-lg text-white hover:bg-red-900/30 transition-colors"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Открыть меню"
      >
        {!isMobileMenuOpen && <Menu size={24} />}
      </button>

   
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden duration-300 ease-in-out animate-in fade-in "
          onClick={closeMobileMenu}
        />
      )}

      <aside
  className={`
          fixed md:sticky top-0 left-0 z-50 h-screen
          bg-[#0f1422]/95 border-r border-red-900/30 
          flex flex-col
          transition-all duration-500 ease-in-out
          ${isSidebarOpen ? "w-72" : "w-30"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        
          
        <div className="p-4 md:p-6 border-b border-red-900/30 flex items-center justify-between duration-300 ease-in-out animate-in fade-in ">
          <div className="flex items-center gap-3">
            { isSidebarOpen ? (
              <Logo  />
            ) :  !isSidebarOpen &&   (
              
              <div className="w-8 h-8 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 transition-transform" >
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            ) }
          </div>
          {isMobileMenuOpen && (
          <div className="p-2 flex justify-end md:hidden">
            <button 
              onClick={closeMobileMenu}
              className="p-4 bg-red-900/30 text-white justify-center rounded-lg transition-colors"
              aria-label="Закрыть меню"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}

          <button
            onClick={toggleSidebar}
            className="hidden md:block p-2 hover:bg-red-900/30 text-white rounded-lg transition-colors ml-auto"
            aria-label={isSidebarOpen ? "Свернуть" : "Развернуть"}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Список чатов */}
        <SidebarNavChat isOpen={isSidebarOpen} />

        {/* Профиль пользователя */}
        <SidebarProfil isOpen={isSidebarOpen}  />
      </aside>
    </>
  );
};

export default Sidebar;