import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.25em] text-amber">404</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-white">This scene didn&apos;t make the final cut.</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-400">
          The page you&apos;re looking for was left on the editing room floor.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-brand-500 px-7 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
