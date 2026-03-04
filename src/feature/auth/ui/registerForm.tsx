"use client";
import InputAuth from "@/src/ui/components/input";
import Button, { ButtonType } from "@/src/ui/components/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { registerThunk } from "@/src/feature/auth/model/registerThunk";

import { Lock, User } from "lucide-react";

const RegisterForm: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuth = useAppSelector((state) => state.auth.isAuth);
  const isError = useAppSelector((state) => state.auth.isError);
  const user = useAppSelector((state) => state.auth.user);
  const errorMessage = useAppSelector((state) => state.auth.errorMessage)

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    password: false,
    confirmPassword: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      name: true,
      password: true,
           confirmPassword: true,

    })

     if (!name.trim() || !password.trim() || !confirmPassword.trim()) return;
    
    if (password !== confirmPassword) return;
    
    dispatch(registerThunk({ 
      username: name, 
      password: password 
    }));
  };

  const handleBlure = (field: 'name' | 'password' | 'confirmPassword') => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  }
   
const getError = (field: 'name' | 'password' | 'confirmPassword' , value: string):boolean => {
  if(!touched[field]) return false;

  if(!value.trim()) return true;

  if(field === 'confirmPassword' && value.trim()){
    if(value !== password) return true;
  }

   if (isError && field === 'name' && name.trim() && password.trim()) {
      return true;
    }

  return false
}

  const getErrorMesssage = (field: 'name' | 'password' | 'confirmPassword'):string |undefined => {
    if(field === 'name' && touched.name && !name.trim()){
      return 'Имя пользователя обязательно'
    }
    if(field === 'password' && touched.password && !password.trim()){
      return 'Пароль обязателен'
    }
    if(field === 'confirmPassword' && touched.confirmPassword){
        if(!confirmPassword.trim()){
            return 'Подтвердите пароль'
        }
        if(confirmPassword !== password){
            return 'Пароли не совпадают'
        }
    }
    if(isError && field === 'name' && name.trim() && password.trim()){
      return errorMessage || "Пользователь с таким именем уже существует"
    }
     return undefined;
  }

  const isFormValid = () =>{
    return(
        name.trim() && password.trim() && confirmPassword.trim() && password === confirmPassword
    )
  }

  useEffect(() => {
    if (isAuth && user?.username) {
      router.push(`/${user.username}/messages`);
    }
  }, [isAuth, router, user]);

  return (
    <form onSubmit={handleSubmit}>
      <InputAuth
        label="Имя пользователя"
        type="text"
        placeholder="Введите имя пользователя"
        icon={User}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => handleBlure('name')}
        hasError={getError('name', name)}
        error={getErrorMesssage('name')}
      />

      <InputAuth
        label="Пароль"
        type="password"
        placeholder="Введите пароль"
        icon={Lock}
        value={password}
        onChange={(e) => setPassword(e.target.value)} 
        onBlur={() => handleBlure('password')}
        hasError={getError('password', password)}
        error={getErrorMesssage('password')}
      />

        <InputAuth
        label="Подтверждение пароля"
        type="password"
        placeholder="Подтвердите пароль"
        icon={Lock}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)} 
        onBlur={() => handleBlure('confirmPassword')}
        hasError={getError('confirmPassword', confirmPassword)}
        error={getErrorMesssage('confirmPassword')}
      />
      <Button
        buttonType={ButtonType.LOGIN} // Используем существующий тип
        onClick={handleSubmit}
        disabled={!isFormValid()} // Опционально: дизейблим если поля пустые
      />
    </form>
  );
};

export default RegisterForm;
