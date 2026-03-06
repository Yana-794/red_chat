import { Check } from 'lucide-react';

const MessageList = () => {
  return (
    <div className="space-y-5 md:space-y-7">
      {/* Сообщение от другого пользователя */}
      <div className="flex items-start gap-3 animate-slideIn">
        {/* Аватар отправителя */}
        <div className="w-8 h-8 md:w-9 md:h-9 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/50 shrink-0 text-xs md:text-sm">
          A
        </div>
        
        {/* Сообщение */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#0f1422]/80 backdrop-blur-sm border border-red-900/30 text-white p-2.5 md:p-3 rounded-xl rounded-tl-none shadow-lg max-w-[85%] md:max-w-md">
            <p className="text-red-400 font-medium text-xs md:text-sm mb-0.5 md:mb-1 truncate">
              Анна
            </p>
            
            <div className="flex items-end justify-between gap-2">
              <p className="text-gray-100 text-sm md:text-base wrap-break-word whitespace-pre-wrap flex-1 min-w-0">
                Привет! Как дела?
              </p>
              
              <span className="text-gray-400 text-xs shrink-0">
                14:30
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Собственное сообщение */}
      <div className="flex items-start gap-3 flex-row-reverse animate-slideIn">
        {/* Аватар отправителя (скрыт для своих сообщений) */}
        <div className="w-8 h-8 md:w-9 md:h-9 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/50 shrink-0 text-xs md:text-sm">
          A
        </div>
        
        {/* Сообщение */}
        <div className="flex-1 min-w-0 flex justify-end">
          <div className="bg-[#0f1422]/80 backdrop-blur-sm border border-red-900/30 text-white p-2.5 md:p-3 rounded-xl rounded-tr-none shadow-lg max-w-[85%] md:max-w-md">
            <div className="flex items-end justify-between gap-2">
              <p className="text-gray-100 text-sm md:text-base wrap-break-word whitespace-pre-wrap flex-1 min-w-0">
                Привет! Всё отлично!
              </p>
              
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-gray-400 text-xs">
                  14:32
                </span>
                <Check className="w-3 h-3 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Сообщение с длинным текстом */}
      <div className="flex items-start gap-3 animate-slideIn">
        <div className="w-8 h-8 md:w-9 md:h-9 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/50 shrink-0 text-xs md:text-sm">
          М
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="bg-[#0f1422]/80 backdrop-blur-sm border border-red-900/30 text-white p-2.5 md:p-3 rounded-xl rounded-tl-none shadow-lg max-w-[85%] md:max-w-md">
            <p className="text-red-400 font-medium text-xs md:text-sm mb-0.5 md:mb-1 truncate">
              Максим
            </p>
            
            <div className="flex items-end justify-between gap-2">
              <p className="text-gray-100 text-sm md:text-base wrap-break-word whitespace-pre-wrap flex-1 min-w-0">
                Это очень длинное сообщение, которое должно показывать, как текст переносится на несколько строк и как при этом выглядят отступы и всё остальное в нашем компоненте
              </p>
              
              <span className="text-gray-400 text-xs shrink-0">
                15:45
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageList;