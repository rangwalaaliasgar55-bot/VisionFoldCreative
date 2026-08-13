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
        <div className="glass-bright rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="animate-floaty mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#7357FF] to-[#5B3FD4] shadow-[0_0_60px_-15px_rgba(115,87,255,0.9)]">
              <Logo className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">VisionFold Admin</h1>
            <p className="mt-1 text-sm text-slate-400">
              Leads · Clients · Projects · WordPress content · Automations
            </p>
          </div>
          <LoginForm role="admin" />
          <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-500/5 p-4 text-xs leading-relaxed text-slate-400">
            <p className="font-semibold text-brand-300">Bootstrap admin</p>
            <p className="mt-1">
              email: <code className="text-slate-200">visionfoldcreative@gmail.com</code>
              <br />
              password: <code className="text-slate-200">aliasgar134</code>
            </p>
            <p className="mt-2 text-slate-500">
              Configure via <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> env vars.
            </p>
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
