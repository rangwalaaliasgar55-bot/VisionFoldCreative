"use client";

import { useState } from "react";
import { ClientRegisterForm, LoginForm } from "@/components/Forms";
import { UserPlus, LogIn } from "lucide-react";

export function PortalAuth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/8 bg-black/15 p-1">
        <button onClick={() => setMode("login")} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "login" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}><LogIn size={14} /> Sign in</button>
        <button onClick={() => setMode("register")} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "register" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}><UserPlus size={14} /> Register</button>
      </div>
      {mode === "login" ? <LoginForm role="client" /> : <ClientRegisterForm />}
      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-600">{mode === "login" ? "New client? Create a private workspace in less than a minute." : "Already registered? Switch to Sign in above."}</p>
    </div>
  );
}
