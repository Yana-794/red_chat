"use client";
import { useEffect } from "react";

import { useAppSelector } from "@/src/store/hooks";
import { useRouter } from "next/navigation";
import Sidebar from "@/src/ui/layout/nav/sidebar";
import Header from "@/src/ui/components/header";

export default function MeProfilPage() {
  const router = useRouter();
  // const dispatch  = useAppDispatch();
  const { isAuth, user } = useAppSelector((state) => state.auth);
  useEffect(() => {
    if (!isAuth) {
      router.push("/login");
    }
  }, [isAuth, router]);

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <p className="text-gray-400">Пользователь не авторизован</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          title={`Настрой свой профиль ${user.username}!`}
          isChat={false}
        />
        <div className="flex-1 overflow-y-auto p-4 space-y-4"></div>
      </div>
    </div>
  );
}
