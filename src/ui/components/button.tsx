"use client"
import type { MouseEventHandler } from 'react';
import styles from '@/src/ui/styles/button.module.css';
import {UserPlus, LogIn, LucideProps} from 'lucide-react'
import type React from 'react';

 enum ButtonType {
  LOGIN = 'login',
  REGISTER = 'register',
}

interface ButtonProps {
  buttonType: ButtonType;
    label?: string;
    disabled?: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
}

const iconMap: Record<ButtonType, React.ComponentType<LucideProps>> = {
  [ButtonType.LOGIN]: LogIn,
  [ButtonType.REGISTER]: UserPlus,


}
const labelsMap: Record<ButtonType, string> = {
  [ButtonType.LOGIN]: 'Войти',
  [ButtonType.REGISTER]: 'Зарегистрироваться',
  
}

const Button = ({ label, disabled, onClick, buttonType}: ButtonProps): React.ReactElement => {
  

 
const Icon = iconMap[buttonType];
const buttonText = label ? label : labelsMap[buttonType];
  return (
    <button
      type="submit"
      className={styles.button}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon />}
      {buttonText}
    </button>
  ); 
};

export default Button;
export { ButtonType };
