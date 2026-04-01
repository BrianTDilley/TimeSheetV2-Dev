import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'white' | 'whiteDanger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  isLoading, 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '', 
  disabled,
  ...props 
}) => {
  
  const baseStyles = "rounded-lg transition duration-300 ease-in-out font-bold flex justify-center items-center gap-2 transform active:scale-95";
  
  const sizes = {
    sm: "py-1.5 px-3 text-xs",
    md: "w-full py-3 px-4",
    lg: "w-full py-4 px-6 text-lg"
  };

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white shadow-md",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    white: "bg-white text-gray-900 hover:bg-gray-50 shadow-md",
    whiteDanger: "bg-white text-red-600 hover:bg-red-50 shadow-md",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
  };

  return (
    <button 
      disabled={isLoading || disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed hover:transform-none' : 'hover:scale-[1.02]'} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className={`animate-spin ${size === 'sm' ? 'h-3 w-3' : 'h-5 w-5'}`} />}
      {children}
    </button>
  );
};
