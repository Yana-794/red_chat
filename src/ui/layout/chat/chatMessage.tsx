import React, {useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { deleteMessageThunk } from "@/src/feature/messages/model/deleteMessageThunk";

const MessageList: React.FC = () => {
  const dispatch = useAppDispatch();

  const { messages, isLoading } = useAppSelector((state) => state.message);
  const currentUser = useAppSelector((state) => state.auth.user);

  // Локальное состояние для ошибок удаления
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Проверка текущего пользователя
  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">Пользователь не авторизован</p>
      </div>
    );
  }


  const handleDeleteMessage = async (messageId: number) => {
    if (window.confirm("Удалить сообщение?")) {
      try {
        await dispatch(deleteMessageThunk(messageId)).unwrap();
        setDeleteError(null);
      } catch (error) {
        console.error("Error deleting message:", error);
        setDeleteError("Не удалось удалить сообщение");
      }
    }
  };

  const formTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm");
    } catch  {
      console.error("Invalid date string:", dateString);
      return "";
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Загрузка сообщений...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-red-600/20 to-red-700/20 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-400">Пока нет сообщений</p>
          <p className="text-gray-500 text-sm mt-2">
            Будьте первым, кто отправит сообщение!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-7">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUser.id;

        return (
          <div
            key={message.id}
            className={`flex items-start gap-3 animate-slideIn group ${
              isOwnMessage ? "flex-row-reverse" : ""
            }`}
          >
            {/* Аватар отправителя */}
            <div className="w-8 h-8 md:w-9 md:h-9 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/50 shrink-0 text-xs md:text-sm">
              {message.username?.[0]?.toUpperCase() || "U"}
            </div>

            {/* Контейнер сообщения */}
            <div
              className={`flex-1 min-w-0 ${isOwnMessage ? "flex justify-end" : ""}`}
            >
              <div
                className={`
                  bg-[#0f1422]/80 backdrop-blur-sm border border-red-900/30 
                  text-white p-2.5 md:p-3 rounded-xl shadow-lg 
                  max-w-[85%] md:max-w-md relative group
                  ${isOwnMessage ? "rounded-tr-none" : "rounded-tl-none"}
                `}
              >
                {/* Имя отправителя для чужих сообщений */}
                {!isOwnMessage && (
                  <p className="text-red-400 font-medium text-xs md:text-sm mb-0.5 md:mb-1 truncate">
                    {message.username}
                  </p>
                )}

                {/* Основной текст сообщения */}
                <div className="flex items-end justify-between gap-2">
                  <p className="text-gray-100 text-sm md:text-base wrap-break-word whitespace-pre-wrap flex-1 min-w-0">
                    {message.content}
                  </p>

                  {/* Время и кнопки */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-gray-400 text-xs">
                      {formTime(message.createdAt)}
                    </span>

                    {isOwnMessage && (
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-blue-400" />
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-400"
                          title="Удалить сообщение"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Обработка ошибок удаления */}
      {deleteError && (
        <div className="mt-2 text-red-500 text-sm">{deleteError}</div>
      )}
    </div>
  );
};

export default MessageList;