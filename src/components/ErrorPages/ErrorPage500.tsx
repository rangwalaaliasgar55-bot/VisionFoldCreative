import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ErrorPage500: React.FC<{ error?: Error; resetError?: () => void }> = ({ error, resetError }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0A0A0B] to-[#121215] px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-600/20 p-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-[#D4AF37] mb-3">500</h1>
        <h2 className="text-xl font-semibold text-[#EDEDED] mb-4">Something Went Wrong</h2>
        
        {error && (
          <div className="mb-6 rounded-lg border border-red-600/30 bg-red-600/10 p-4 text-left">
            <p className="text-xs font-mono text-red-300 break-words">{error.message}</p>
          </div>
        )}
        
        <p className="text-sm text-[#888891] mb-8">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>

        <div className="flex flex-col gap-3">
          {resetError && (
            <button
              onClick={resetError}
              className="rounded-lg bg-[#D4AF37] text-[#0A0A0B] font-semibold py-3 px-6 hover:bg-[#E5C04B] transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] font-semibold py-3 px-6 hover:bg-[#D4AF37]/10 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};
