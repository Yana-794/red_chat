"use client"
import type React from "react";
import {UserPlus, MessageCircle, LucideProps} from 'lucide-react'

interface HeadPros {
    type: HeadType;
}

enum HeadType {
    LOGIN = 'login',
    REGISTER = 'register',
}
const Head: React.FC <HeadPros>= ({ type}) => {

    const iconsMap: Record<HeadType, React.ComponentType<LucideProps>> = {
    [HeadType.REGISTER]: UserPlus,
    [HeadType.LOGIN]: MessageCircle,
  };
  const labelMap: Record <HeadType, string> = {
     [HeadType.REGISTER]: 'Создайте новый аккаунт', 
     [HeadType.LOGIN]: 'Добро пожаловать обратно'
  }

  const Icon = iconsMap[type] || null;
const displayText =  labelMap[type];
    return (
<div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-red-600 to-red-700 rounded-2xl mb-4 shadow-lg shadow-red-900/50">
               {Icon && <Icon color="#ffffff"/>}
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              RedChat
            </h1>
            <p className="text-gray-300 text-sm">{displayText}</p>
          </div>
    )
}

export default Head
export {HeadType}