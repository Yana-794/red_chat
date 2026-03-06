"use client";
import React from "react";
import { MessageCircle } from "lucide-react";
const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
      <h1 className="text-xl md:text-2xl font-bold bg-linear-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
        RedChat
      </h1>
    </div>
  );
};

export default Logo;
