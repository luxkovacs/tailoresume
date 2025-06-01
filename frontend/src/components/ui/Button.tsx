import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

  const variantStyles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    outline: "border border-indigo-600 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-900",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
    destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
    link: "text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400",
    icon: "hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
  };

  const sizeStyles = {
    sm: "h-9 px-3 py-1.5 text-sm",
    md: "h-10 px-4 py-2 text-base",
    lg: "h-11 px-5 py-2.5 text-lg",
    icon: "h-9 w-9"
  };

  return (
    <button
      className={`
        ${baseStyles} 
        ${variantStyles[variant]} 
        ${sizeStyles[size]} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
