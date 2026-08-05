import React, { forwardRef } from 'react';
import { cn } from '../utils';
import { Loader2 } from 'lucide-react';

// Button variants with premium styling
const buttonVariants = {
  primary: `
    bg-[#D4AF37] text-[#0A0A0B] font-semibold 
    hover:bg-[#E5C349] hover:shadow-[0_4px_16px_rgba(212,175,55,0.4)]
    active:bg-[#C4A030]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  secondary: `
    bg-transparent border-2 border-[#D4AF37]/50 text-[#D4AF37]
    hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]
    active:bg-[#D4AF37]/20
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent text-[#EDEDED]/80
    hover:bg-white/5 hover:text-[#EDEDED]
    active:bg-white/10
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  danger: `
    bg-red-600 text-white font-semibold
    hover:bg-red-500 hover:shadow-[0_4px_16px_rgba(220,38,38,0.4)]
    active:bg-red-700
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  success: `
    bg-green-600 text-white font-semibold
    hover:bg-green-500 hover:shadow-[0_4px_16px_rgba(34,197,94,0.4)]
    active:bg-green-700
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  link: `
    bg-transparent text-[#D4AF37] underline-offset-4
    hover:underline hover:text-[#E5C349]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
} as const;

const buttonSizes = {
  xs: 'px-2.5 py-1 text-[10px] tracking-wide',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
  xl: 'px-8 py-3 text-lg',
  icon: 'p-2',
  'icon-sm': 'p-1.5',
  'icon-lg': 'p-3',
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabledOrLoading = isDisabled || isLoading || disabled;

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2',
          'rounded-lg font-medium uppercase tracking-wider',
          'transition-all duration-200',
          'hover:scale-[1.02] hover:-translate-y-0.5',
          'active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]',
          'cursor-pointer select-none',
          buttonVariants[variant],
          buttonSizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabledOrLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin absolute" />
        )}
        <span className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
  tooltip?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', variant = 'ghost', tooltip, ...props }, ref) => {
    const iconSizes = {
      xs: 'p-1.5',
      sm: 'p-2',
      md: 'p-2.5',
      lg: 'p-3',
      xl: 'p-3.5',
      icon: 'p-2',
      'icon-sm': 'p-1.5',
      'icon-lg': 'p-3',
    } as const;

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn('rounded-full', iconSizes[size])}
        title={tooltip}
        aria-label={props['aria-label']}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
