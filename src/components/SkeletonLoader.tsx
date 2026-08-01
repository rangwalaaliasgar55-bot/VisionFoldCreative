import React from 'react';

interface SkeletonLoaderProps {
  isLoaded: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ isLoaded }) => {
  if (isLoaded) return null;

  return (
    <div className="absolute inset-0 z-10 w-full h-full bg-[#121215] overflow-hidden">
      <div 
        className="absolute inset-0 w-full h-full animate-pulse bg-[#222226]/50"
      />
      <div 
        className="absolute inset-0 w-[200%] h-full animate-shimmer bg-gradient-to-r from-transparent via-[#222226] to-transparent"
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  );
};
