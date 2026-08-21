import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { clients, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "vf_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type StaffRole = "admin" | "editor" | "accountant";
export type AppRole = StaffRole | "client";

export type SessionPayload = {
  sub: number;
  role: AppRole;
  email: string;
  name: string;
};

export const STAFF_ROLES: StaffRole[] = ["admin", "editor", "accountant"];

export function isStaffRole(role: unknown): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

function secretKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "visionfold-dev-secret-rotate-in-prod"
  );
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return test.length === expected.length && timingSafeEqual(test, expected);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload, sub: String(payload.sub) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: Number(payload.sub),
      role: payload.role,
      email: payload.email,
      name: payload.name,
    } as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireStaff(roles: StaffRole[] = STAFF_ROLES) {
  const session = await readSession();
  if (!session || !isStaffRole(session.role) || !roles.includes(session.role)) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.sub)).limit(1);
  const user = rows[0];
  if (!user || !isStaffRole(user.role) || !roles.includes(user.role)) return null;
  return user;
}

export async function requireAdmin() {
  return requireStaff(["admin"]);
}

export async function requireClient() {
  const session = await readSession();
  if (!session || session.role !== "client") return null;
  const rows = await db.select().from(clients).where(eq(clients.id, session.sub)).limit(1);
  const client = rows[0];
  if (!client || client.status !== "active") return null;
  return client;
}

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function ok<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export async function readBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function requestIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}
