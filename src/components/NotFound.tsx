import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-[#D4AF37] mb-4">404</div>
        <h1 className="text-2xl font-bold text-[#EDEDED] mb-4">Page Not Found</h1>
        <p className="text-[#A0A0A0] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-[#D4AF37] text-[#0A0A0B] font-semibold rounded-lg hover:bg-[#E5C04B] transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/work"
            className="px-6 py-3 border border-[#D4AF37] text-[#D4AF37] font-semibold rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
          >
            View Our Work
          </Link>
        </div>
      </div>
    </div>
  );
}
