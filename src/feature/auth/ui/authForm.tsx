"use client";
import InputAuth from "@/src/ui/components/input";
import Button, { ButtonType } from "@/src/ui/components/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { loginThunk } from "@/src/feature/auth/model/authThunk";

import { Lock, User } from "lucide-react";

const AuthForm: React.FC = () => {

    const router = useRouter();
    const dispatch = useAppDispatch();
    const isAuth = useAppSelector((state) => state.auth.isAuth);
    const isError = useAppSelector((state) => state.auth.isError)
    const user = useAppSelector((state) => state.auth.user)

    const [name, setName] = useState("");
    const [password, setPassword] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
if(!name.trim() || !password.trim()) return;
dispatch(loginThunk({username: name, password: password}));
    }

    const hasError = (value: string) => {
      return   (isError && value.trim() === "") || isError;
    }

    useEffect(() => {
        if(isAuth){
            router.push(`/${user?.username}/messages`)
        }
    }, [isAuth, router, user])

  return (
    <form onSubmit={handleSubmit}>
      <InputAuth
        label="Имя пользователя"
        type="text"
        placeholder="Введите имя пользователя"
        icon={User}
        value={name}
        onChange= {(e) => setName(e.target.value)}
        hasError={hasError(name)}
      />
      
      <InputAuth
        label="Пароль"
        type="password"
        placeholder="Введите пароль"
        icon={Lock}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
 hasError={hasError(password)}      
      />
       <Button
                buttonType={ButtonType.LOGIN}  // Используем существующий тип
                onClick={handleSubmit}
                disabled={!name.trim() || !password.trim()}  // Опционально: дизейблим если поля пустые
            />
    </form>
  );
};

export default AuthForm;
