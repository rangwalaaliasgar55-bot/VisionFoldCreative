"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.25em] text-amber">VisionFold Creative</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-white">Render failed mid-cut.</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-400">
          Something broke on our timeline — not yours. Try again, and if it keeps happening we want to know.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-brand-500 px-7 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-7 py-2.5 text-sm font-semibold text-warm transition hover:bg-white/5"
          >
            Back to home
          </Link>
        </div>
        {error.digest && <p className="mt-5 text-[11px] text-slate-600">ref: {error.digest}</p>}
      </div>
    </div>
  );
}
