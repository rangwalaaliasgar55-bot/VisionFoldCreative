"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";

/**
 * Branded error boundary. Keeps people inside the studio rather than dropping
 * them on the default Next.js stack page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[visionfold]", error);
  }, [error]);

  return (
    <div className="bg-aurora relative flex min-h-screen items-center justify-center px-6">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
          Render failed
        </p>
        <h1 className="font-display mt-4 text-3xl font-bold text-white sm:text-4xl">
          Something dropped a <span className="text-gradient">frame</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400">
          An unexpected error interrupted this page. Try again — if it keeps happening, send us the
          reference below and we&rsquo;ll chase it down.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-slate-600">ref: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="group flex items-center gap-2 rounded-full bg-[#7357FF] px-7 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/30 transition-transform hover:scale-105"
          >
            <RefreshCcw size={15} className="transition-transform group-hover:-rotate-180" />
            Try again
          </button>
          <Link
            href="/"
            className="glass flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-white/30 hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
