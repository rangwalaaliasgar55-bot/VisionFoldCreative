import React, { forwardRef, useState } from 'react';
import { cn } from '../utils';
import { AlertCircle, Eye, EyeOff, Check } from 'lucide-react';

// Input component with premium styling
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  success?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showValidIcon?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      success,
      inputSize = 'md',
      leftIcon,
      rightIcon,
      showValidIcon = false,
      fullWidth = true,
      className,
      id,
      disabled,
      type,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasValue = value !== undefined && value !== '';
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const isPassword = type === 'password';

    const sizes = {
      sm: 'h-8 text-xs px-3',
      md: 'h-10 text-sm px-4',
      lg: 'h-12 text-base px-5',
    };

    const iconSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium transition-colors duration-200',
              hasError ? 'text-red-400' : 'text-[#EDEDED]/80',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-[#EDEDED]/50', iconSizes[inputSize])}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            value={value}
            className={cn(
              'w-full bg-[#121215] rounded-lg border text-[#EDEDED]',
              'placeholder:text-[#EDEDED]/40',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              sizes[inputSize],
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              hasError && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              hasSuccess && 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20',
              !hasError && !hasSuccess && 'border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            type={isPassword && showPassword ? 'text' : type}
            {...props}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showValidIcon && hasValue && !hasError && (
              <span className={cn(iconSizes[inputSize], 'text-green-400')}>
                <Check />
              </span>
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(iconSizes[inputSize], 'text-[#EDEDED]/50 hover:text-[#EDEDED]/80 transition-colors cursor-pointer')}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            )}

            {!isPassword && rightIcon && (
              <div className={cn(iconSizes[inputSize], 'text-[#EDEDED]/50')}>
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {(error || success) && (
          <div className={cn('flex items-center gap-1.5 text-xs', hasError ? 'text-red-400' : 'text-green-400')}>
            {hasError && <AlertCircle className="w-3.5 h-3.5" />}
            {error || success}
          </div>
        )}

        {!error && hint && (
          <p className="text-xs text-[#EDEDED]/40">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  showCharCount?: boolean;
  maxLength?: number;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      inputSize = 'md',
      showCharCount = false,
      maxLength,
      fullWidth = true,
      className,
      id,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const charCount = typeof value === 'string' ? value.length : 0;
    const isNearLimit = maxLength && charCount >= maxLength * 0.9;

    const sizes = {
      sm: 'min-h-[80px] text-xs px-3 py-2',
      md: 'min-h-[120px] text-sm px-4 py-3',
      lg: 'min-h-[160px] text-base px-5 py-4',
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium transition-colors duration-200',
              error ? 'text-red-400' : 'text-[#EDEDED]/80',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            disabled={disabled}
            value={value}
            maxLength={maxLength}
            className={cn(
              'w-full bg-[#121215] rounded-lg border text-[#EDEDED]',
              'placeholder:text-[#EDEDED]/40 resize-y',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              sizes[inputSize],
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              !error && 'border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />

          {showCharCount && maxLength && (
            <div className={cn(
              'absolute bottom-2 right-2 text-xs transition-colors',
              isNearLimit ? 'text-amber-400' : 'text-[#EDEDED]/40'
            )}>
              {charCount}/{maxLength}
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-[#EDEDED]/40">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Checkbox component
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, disabled, id, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            disabled={disabled}
            className={cn(
              'peer w-5 h-5 rounded border-2 bg-[#121215] appearance-none cursor-pointer',
              'transition-all duration-200',
              'checked:bg-[#D4AF37] checked:border-[#D4AF37]',
              'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:ring-offset-2 focus:ring-offset-[#0A0A0B]',
              error ? 'border-red-500' : 'border-[#D4AF37]/30',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
          <svg className="absolute top-0.5 left-0.5 w-4 h-4 pointer-events-none hidden peer-checked:block" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0A0A0B]" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {label && (
            <label htmlFor={id} className={cn('text-sm font-medium text-[#EDEDED] cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
              {label}
            </label>
          )}
          {description && <p className="text-xs text-[#EDEDED]/50 mt-0.5">{description}</p>}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Switch component (toggle)
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, onCheckedChange, className, disabled, id, checked, onChange, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={id}
            disabled={disabled}
            checked={checked}
            onChange={(e) => {
              onChange?.(e);
              onCheckedChange?.(e.target.checked);
            }}
            className="peer sr-only"
            {...props}
          />
          
          <div
            className={cn(
              'w-11 h-6 rounded-full cursor-pointer transition-colors duration-200',
              checked ? 'bg-[#D4AF37]' : 'bg-[#121215]',
              'border border-[#D4AF37]/30',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          
          <div
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[#EDEDED] shadow-md',
              'pointer-events-none transition-colors duration-200',
              checked && 'translate-x-5'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          {label && (
            <label htmlFor={id} className={cn('text-sm font-medium text-[#EDEDED] cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
              {label}
            </label>
          )}
          {description && <p className="text-xs text-[#EDEDED]/50 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';

// Radio component
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, disabled, id, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={id}
            disabled={disabled}
            className={cn(
              'peer w-5 h-5 rounded-full border-2 bg-[#121215] appearance-none cursor-pointer',
              'transition-all duration-200',
              'border-[#D4AF37]/30',
              'checked:border-[#D4AF37]',
              'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:ring-offset-2 focus:ring-offset-[#0A0A0B]',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
          <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-[#D4AF37] pointer-events-none hidden peer-checked:block" />
        </div>

        <div className="flex-1 min-w-0">
          {label && (
            <label htmlFor={id} className={cn('text-sm font-medium text-[#EDEDED] cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
              {label}
            </label>
          )}
          {description && <p className="text-xs text-[#EDEDED]/50 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);

Radio.displayName = 'Radio';
