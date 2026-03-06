import React from 'react'
import { Search, MoreVertical, Users } from 'lucide-react';


const Header: React.FC = () => {
    return (
    <header className="p-3 md:p-4 border-b border-red-900/30 bg-[#0a0e27]/40 backdrop-blur-sm flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
     
        {/* Аватар чата */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 cursor-pointer hover:scale-105 transition-transform duration-200">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
        
        {/* Информация о чате */}
        <div className="flex-1 min-w-0 cursor-pointer">
          <h2 className="font-semibold text-base md:text-lg text-white truncate">
            чат 
          </h2>
          <p className="text-xs md:text-sm text-gray-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full shrink-0"></span>
            <span className="truncate">Онлайн: 12</span>
          </p>
        </div>
      </div>
      
      {/* Кнопки действий */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        <button 
          className="hidden md:block p-2.5 hover:bg-red-900/20 rounded-xl transition-colors duration-200 group"
          title="Поиск"
        >
          <Search className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>
        <button 
          className="p-2 md:p-2.5 hover:bg-red-900/20 rounded-xl transition-colors duration-200 group"
          title="Настройки"
        >
          <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>
      </div>
    </header>
  )
}

export default Header
