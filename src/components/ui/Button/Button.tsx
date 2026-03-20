import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonProps } from './types';
import { variantStyles, sizeStyles } from './constants';
import { cn } from '@/lib/utils';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    justify = 'center',
    isLoading = false,
 
    leftIcon: LeftIcon, 
    rightIcon: RightIcon, 
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-lg overflow-hidden';
    
    const justifyStyles = {
      start: 'justify-start text-left',
      center: 'justify-center text-center',
      end: 'justify-end text-right',
      between: 'justify-between',
    };

    const buttonClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      justifyStyles[justify],
      className
    );

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={buttonClasses}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn("animate-spin", size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
        ) : (
          <>
            {LeftIcon && <LeftIcon className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />}
            {children}
            {RightIcon && <RightIcon className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
