import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/SiteChrome";
import { LoginForm } from "@/components/Forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in to the VisionFold Creative admin CMS.",
};

export default function AdminLoginPage() {
  return (
    <div className="bg-aurora relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-md">
        <div className="auth-3d-card glass-bright rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="animate-floaty mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#7357FF] to-[#5B3FD4] shadow-[0_0_60px_-15px_rgba(115,87,255,0.9)]">
              <Logo className="h-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">VisionFold staff</h1>
            <p className="mt-1 text-sm text-slate-400">
              Role-aware workspace for owners, editors and accountants.
            </p>
          </div>
          <LoginForm role="admin" />
          <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-500/5 p-4 text-xs leading-relaxed text-slate-400">
            <p className="font-semibold text-brand-300">Protected staff access</p>
            <p className="mt-1">Your owner assigns your role. Editors see production and publishing tools; accountants see the financial workspace; owners control everything.</p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-300">← Back to site</Link>
          {" · "}
          <Link href="/portal/login" className="hover:text-slate-300">Client login</Link>
        </p>
      </div>
    </div>
  );
}
