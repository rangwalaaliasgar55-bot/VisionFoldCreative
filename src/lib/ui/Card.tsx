import React, { forwardRef } from 'react';
import { cn } from '../utils';

// Card component with premium styling
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  selected?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      selected = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const paddingSizes = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variant === 'default' && 'bg-[#121215] border border-[#D4AF37]/10',
          variant === 'elevated' && 'bg-[#121215] shadow-lg shadow-black/20',
          variant === 'outline' && 'bg-transparent border-2 border-[#D4AF37]/20',
          variant === 'ghost' && 'bg-transparent',
          selected && 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20',
          paddingSizes[padding],
          hoverable && 'hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className,
  ...props
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)} {...props}>
      <div className="flex-1 min-w-0">
        {title && <h3 className="text-lg font-semibold text-[#EDEDED]">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-[#EDEDED]/60">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// Card Content
export function CardContent({ 
  children, 
  className, 
  ...props 
}: { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props}>{children}</div>;
}

// Card Footer
export function CardFooter({ 
  children, 
  className, 
  ...props 
}: { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-[#D4AF37]/10', className)} {...props}>
      {children}
    </div>
  );
}

// Stat Card - For displaying metrics
export interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  iconColor?: 'gold' | 'green' | 'blue' | 'red' | 'purple';
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  iconColor = 'gold',
  className,
}: StatCardProps) {
  const iconColors = {
    gold: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-[#EDEDED]/60',
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-[#D4AF37]/10 bg-[#121215] p-5',
        'hover:border-[#D4AF37]/20 transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[#EDEDED]/60">
          {label}
        </span>
        {icon && (
          <div className={cn('p-2 rounded-lg', iconColors[iconColor])}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold text-[#EDEDED] mb-1">
        {value}
      </div>
      
      {change && (
        <div className={cn('text-xs font-medium', trendColors[change.trend])}>
          {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'} {Math.abs(change.value)}%
        </div>
      )}
    </div>
  );
}

// Media Card - For portfolio items, images, etc.
export interface MediaCardProps extends Omit<CardProps, 'children'> {
  image?: string;
  imageAlt?: string;
  badge?: string;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

export function MediaCard({
  image,
  imageAlt,
  badge,
  title,
  description,
  footer,
  onClick,
  className,
  ...props
}: MediaCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#D4AF37]/10 bg-[#121215] overflow-hidden cursor-pointer',
        'hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-black/20',
        'transition-all duration-200',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {image && (
        <div className="relative aspect-video overflow-hidden bg-[#1E1E23]">
          <img
            src={image}
            alt={imageAlt || title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {badge && (
            <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider bg-[#D4AF37] text-[#0A0A0B] rounded">
              {badge}
            </span>
          )}
        </div>
      )}
      
      <div className="p-4">
        <h4 className="font-semibold text-[#EDEDED] mb-1 line-clamp-1">{title}</h4>
        {description && (
          <p className="text-sm text-[#EDEDED]/60 line-clamp-2">{description}</p>
        )}
      </div>
      
      {footer && (
        <div className="px-4 pb-4">
          {footer}
        </div>
      )}
    </div>
  );
}

// List Card - For lists of items
export interface ListCardProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    leftIcon?: React.ReactNode;
    rightContent?: React.ReactNode;
    onClick?: () => void;
  }>;
}

export function ListCard({ items, className, ...props }: ListCardProps) {
  return (
    <div className={cn('rounded-xl border border-[#D4AF37]/10 bg-[#121215] overflow-hidden', className)} {...props}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'flex items-center gap-4 p-4 transition-colors duration-150',
            'hover:bg-white/[0.02]',
            index !== items.length - 1 && 'border-b border-[#D4AF37]/10',
            item.onClick && 'cursor-pointer'
          )}
          onClick={item.onClick}
        >
          {item.leftIcon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              {item.leftIcon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[#EDEDED]">{item.title}</div>
            {item.subtitle && (
              <div className="text-sm text-[#EDEDED]/60">{item.subtitle}</div>
            )}
            {item.description && (
              <div className="text-sm text-[#EDEDED]/40 mt-0.5">{item.description}</div>
            )}
          </div>
          
          {item.rightContent && (
            <div className="flex-shrink-0">{item.rightContent}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// Notification Card - For alerts, messages
export interface NotificationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp?: string;
  unread?: boolean;
  onDismiss?: () => void;
}

export function NotificationCard({
  type = 'info',
  title,
  message,
  timestamp,
  unread = false,
  onDismiss,
  className,
  ...props
}: NotificationCardProps) {
  const typeStyles = {
    info: 'border-l-[#D4AF37]',
    success: 'border-l-green-500',
    warning: 'border-l-amber-500',
    error: 'border-l-red-500',
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border border-[#D4AF37]/10 bg-[#121215] p-4 pl-5',
        `border-l-4 ${typeStyles[type]}`,
        unread && 'bg-[#D4AF37]/5',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {unread && (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            )}
            <h4 className="font-medium text-[#EDEDED]">{title}</h4>
          </div>
          {message && (
            <p className="mt-1 text-sm text-[#EDEDED]/60">{message}</p>
          )}
          {timestamp && (
            <span className="mt-2 text-xs text-[#EDEDED]/40">{timestamp}</span>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded text-[#EDEDED]/40 hover:text-[#EDEDED] hover:bg-white/5 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
