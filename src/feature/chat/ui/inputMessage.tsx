'use client'
import React, { useState } from "react";
import { Send } from "lucide-react";
import { useAppSelector } from "@/src/store/hooks";
import { websocketService } from "@/src/feature/websocket/websocketService";

const InputMessage: React.FC = () => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const isConnected = useAppSelector(
    (state) => state.websocket.status === "connected"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !isConnected || isSending) return;
    
    setIsSending(true);
    
    try {
      const success = websocketService.sendMessage(message);
      if (success) {
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <footer className="p-2 md:p-4 bg-[#0a0e27]/40 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isConnected ? "Введите сообщение..." : "Подключение к чату..."
            }
            className="w-full p-2.5 md:p-3 rounded-xl bg-[#0f1422]/60 border border-red-900/30 focus:ring-2 focus:ring-red-600 focus:outline-none text-white placeholder-gray-500 text-sm md:text-base"
            disabled={!isConnected}
          />
        </div>
        
        <button
          type="submit"
          disabled={!isConnected || !message.trim() || isSending}
          className="bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-rose-600 disabled:to-red-600 disabled:cursor-not-allowed text-white p-2.5 md:p-3 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50 transition-all duration-200 shrink-0"
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </form>
    </footer>
  );
};

export default InputMessage;