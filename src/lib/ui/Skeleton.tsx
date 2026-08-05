import React from 'react';
import { cn } from '../utils';

// Base skeleton component
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'shimmer' | 'pulse' | 'none';
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
  className,
  style,
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-[#1E1E23]';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const shimmerStyle = animation === 'shimmer' ? {
    background: 'linear-gradient(90deg, #1E1E23 25%, #2A2A30 50%, #1E1E23 75%)',
    backgroundSize: '200% 100%',
  } : {};

  const pulseStyle = animation === 'pulse' ? {
    opacity: 0.6,
  } : {};

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{
        width,
        height,
        ...shimmerStyle,
        ...pulseStyle,
        ...style,
      }}
      {...props}
    />
  );
}

// Text skeleton
export function SkeletonText({ 
  lines = 1, 
  className,
  lastLineWidth = '60%',
  ...props 
}: { 
  lines?: number; 
  className?: string;
  lastLineWidth?: string;
} & SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={14}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({ 
  size = 'md',
  className,
  ...props 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
} & Omit<SkeletonProps, 'variant' | 'width' | 'height'>) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  
  return (
    <Skeleton 
      variant="circular" 
      className={cn(sizes[size], className)} 
      {...props} 
    />
  );
}

// Card skeleton
export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-[#D4AF37]/10 bg-[#121215] p-5 space-y-4', className)} {...props}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={14} width="40%" />
          <Skeleton variant="text" height={12} width="25%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton height={32} width={80} />
        <Skeleton height={32} width={80} />
      </div>
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow({ 
  columns = 5,
  className,
  ...props
}: { 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4 py-3 px-4 border-b border-[#D4AF37]/10', className)} {...props}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={14}
          className="flex-1"
        />
      ))}
    </div>
  );
}

// Chart skeleton
export function SkeletonChart({ 
  height = 200,
  className,
  ...props
}: { 
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-[#D4AF37]/10 bg-[#121215] p-5', className)} {...props}>
      <div className="flex items-end justify-between h-full gap-2" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const heights = [40, 65, 45, 80, 55, 70, 50, 85];
          return (
            <div
              key={i}
              className="flex-1 bg-[#D4AF37]/10 rounded-t"
              style={{ height: `${heights[i]}%` }}
            />
          );
        })}
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton variant="text" height={12} width="20%" />
        <Skeleton variant="text" height={12} width="15%" />
      </div>
    </div>
  );
}

// Stat card skeleton
export function SkeletonStatCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-[#D4AF37]/10 bg-[#121215] p-5', className)} {...props}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="text" height={12} width="50%" />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton variant="text" height={32} width="40%" className="mb-2" />
      <Skeleton variant="text" height={12} width="60%" />
    </div>
  );
}

// Image placeholder skeleton
export function SkeletonImage({ 
  aspectRatio = '16/9',
  className,
  ...props
}: { 
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div 
      className={cn('relative overflow-hidden rounded-lg bg-[#1E1E23]', className)}
      style={{ aspectRatio }}
      {...props}
    />
  );
}

// Video skeleton
export function SkeletonVideo({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-[#1E1E23]', className)} {...props}>
      <div className="aspect-video" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[20px] border-l-[#D4AF37] border-y-[12px] border-y-transparent ml-1" />
        </div>
      </div>
    </div>
  );
}

// Dashboard skeleton
export function SkeletonDashboard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      
      <SkeletonChart height={240} />
      
      <div className="rounded-xl border border-[#D4AF37]/10 bg-[#121215]">
        <div className="p-4 border-b border-[#D4AF37]/10">
          <Skeleton variant="text" height={18} width="30%" />
        </div>
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
      </div>
    </div>
  );
}

// Content block skeleton
export function SkeletonContentBlock({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      <Skeleton height={28} width="40%" />
      <SkeletonText lines={4} />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton height={80} />
            <Skeleton variant="text" height={14} width="70%" />
            <Skeleton variant="text" height={12} width="50%" />
          </div>
        ))}
      </div>
    </div>
  );
}
