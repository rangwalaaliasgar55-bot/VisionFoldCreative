import type { Metadata } from "next";
import { Logo } from "@/components/SiteChrome";
import { LoginForm } from "@/components/Forms";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client Login",
  description: "Sign in to your VisionFold Creative client portal.",
};

export default function PortalLoginPage() {
  return (
    <div className="bg-aurora relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-md">
        <div className="glass-bright rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="animate-floaty mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#7357FF] to-[#5B3FD4] shadow-[0_0_60px_-15px_rgba(115,87,255,0.9)]">
              <Logo className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Client portal</h1>
            <p className="mt-1 text-sm text-slate-400">
              Your projects, cuts, messages and invoices — in one place.
            </p>
          </div>
          <LoginForm role="client" />
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 text-xs leading-relaxed text-slate-400">
            <p className="font-semibold text-cyan-300">Demo account</p>
            <p className="mt-1">
              email: <code className="text-slate-200">client@visionfold.com</code>
              <br />
              password: <code className="text-slate-200">demo1234</code>
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-300">← Back to site</Link>
          {" · "}
          <Link href="/admin/login" className="hover:text-slate-300">Admin login</Link>
        </p>
      </div>
    </div>
  );
}
