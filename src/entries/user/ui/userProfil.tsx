/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { getCurrentUserThunk } from '@/src/entries/user/model/getCurrentUserThunk '
import { updateUserProfileThunk } from '@/src/entries/user/model/updateUserProfileThunk '
import Image from "next/image";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserFormData {
  username: string;
  description: string;
  avatarPreview: string | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { user, updateLoading } = useAppSelector((state) => state.user);
  
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
     username: "",
    description: "",
    avatarPreview: null,
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      dispatch(getCurrentUserThunk());
    }
  }, [isOpen, dispatch]);




  // Обновляем formData при изменении user
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username || "",
        description: user.description || "",
        avatarPreview: user.avatar || '',
      });
    }
  }, [user, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatarPreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.username);
    formDataToSend.append("description", formData.description);
    if (avatarFile) {
      formDataToSend.append("avatar", avatarFile);
    }
    await dispatch(updateUserProfileThunk(formDataToSend));
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        username: user.username || "",
        description: user.description || "",
        avatarPreview: user.avatar || null,
      });
    }
    setAvatarFile(null);
  };

  if (!isOpen || !mounted) return null;

  // Используем портал для рендеринга модалки в body
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1f3a] rounded-xl w-full md:max-w-md max-w-min p-6  relative z-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Профиль</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Аватар */}
        <div className="flex justify-center mb-6">
          <div
            className="relative group cursor-pointer"
            onClick={handleAvatarClick}
          >
            <div className="w-24 h-24 rounded-full bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
              {formData.avatarPreview ? (
                <Image
                  src={formData.avatarPreview}
                  alt="Avatar"
                  width={96}
                  height={96}
                  unoptimized 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-white font-bold">
                  {formData.username?.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>

            {isEditing && (
              <>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        {/* Форма */}
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Имя пользователя
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f1429] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Введите имя"
              />
            ) : (
              <p className="text-lg text-white">{formData.username}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              О себе
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0f1429] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Расскажите о себе"
                rows={3}
              />
            ) : (
              <p className="text-gray-300">{formData.description || "Пока ничего не рассказано о себе"}</p>
            )}
          </div>

        
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 mt-6">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {updateLoading ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Отмена
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Редактировать
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Закрыть
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserProfileModal;