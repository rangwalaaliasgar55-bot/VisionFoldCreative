import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { readSession, requireStaff } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { Toasts } from "@/components/AdminUI";
import { AdminShell } from "@/components/Admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const admin = await requireStaff();
  const session = await readSession();
  if (session?.role === "client") redirect("/portal");

  // Middleware keeps protected admin routes behind a session cookie. The login
  // page shares this layout, so unauthenticated requests must render it without
  // the application chrome instead of redirecting back to themselves.
  if (!admin) return <>{children}</>;

  return (
    <AdminShell name={admin.name} email={admin.email} role={admin.role}>
      {children}
      <Toasts />
    </AdminShell>
  );
}
