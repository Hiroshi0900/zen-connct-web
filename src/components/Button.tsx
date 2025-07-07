import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  loading = false, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-8 py-4 rounded-xl font-semibold text-lg transition-all';
  
  const variantClasses = {
    primary: 'bg-accent-teal text-primary-dark hover:shadow-lg hover:shadow-accent-teal/30 hover:-translate-y-0.5',
    secondary: 'border-2 border-accent-teal text-accent-teal hover:bg-accent-teal hover:text-primary-dark hover:-translate-y-0.5',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  const finalClassName = [
    baseClasses,
    variantClasses[variant],
    (disabled || loading) && disabledClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={finalClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? `${children}...` : children}
    </button>
  );
}