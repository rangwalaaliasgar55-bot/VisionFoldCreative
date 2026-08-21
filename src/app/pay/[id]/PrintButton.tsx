"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print mt-3 w-full rounded-xl border border-white/12 bg-white/[0.03] py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07]"
    >
      ⬇ Download / print PDF
    </button>
  );
}
