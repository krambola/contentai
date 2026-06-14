'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-brand-600 text-white hover:bg-brand-800 border border-brand-600':
              variant === 'primary',
            'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50':
              variant === 'secondary',
            'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent':
              variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 border border-red-600':
              variant === 'danger',
          },
          {
            'text-xs px-3 py-1.5': size === 'sm',
            'text-sm px-4 py-2': size === 'md',
            'text-base px-5 py-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
