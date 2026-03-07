import React from "react";
import { Paperclip, Send } from "lucide-react";

const InputMessage: React.FC = () => {
  return (
    <footer className="p-2 md:p-4  bg-[#0a0e27]/40 backdrop-blur-sm">
      <form className="flex items-center gap-2 md:gap-3">
        {/* Кнопка прикрепления файла */}
        <button
          type="button"
          className="hidden md:block p-3 hover:bg-red-900/20 rounded-xl transition-colors duration-200 group shrink-0"
          title="Прикрепить файл"
        >
          <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>

        {/* Поле ввода */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Введите сообщение..."
            className="w-full p-2.5 md:p-3 pr-16 rounded-xl bg-[#0f1422]/60 border border-red-900/30 focus:ring-2 focus:ring-red-600 focus:outline-none text-white placeholder-gray-500 text-sm md:text-base transition-all duration-200"
            required
          />
        </div>

        {/* Кнопка отправки */}
        <button
          type="submit"
          className="bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white p-2.5 md:p-3 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 hover:shadow-xl hover:shadow-red-900/60 transform hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
          title="Отправить"
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </form>
    </footer>
  );
};

export default InputMessage;
