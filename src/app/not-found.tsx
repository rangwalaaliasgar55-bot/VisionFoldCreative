import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="bg-aurora relative flex min-h-screen items-center justify-center px-6">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-xl text-center">
        <p className="font-display text-[7rem] font-bold leading-none text-white/10 sm:text-[10rem]">
          404
        </p>
        <p className="-mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Frame not found
        </p>
        <h1 className="font-display mt-4 text-3xl font-bold text-white sm:text-4xl">
          This cut didn&rsquo;t make the <span className="text-gradient">final edit</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400">
          The page you were looking for has been moved, renamed, or never existed. Let&rsquo;s get
          you back to something worth watching.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-full bg-[#7357FF] px-7 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#7357FF]/30 transition-transform hover:scale-105"
          >
            Back to home
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/work"
            className="glass flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-white/30 hover:text-white"
          >
            <Film size={15} className="text-cyan-300" />
            See the work
          </Link>
        </div>
      </div>
    </div>
  );
}
