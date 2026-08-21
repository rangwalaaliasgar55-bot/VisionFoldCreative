/**
 * Integration-test harness.
 *
 * Route handlers read sessions through next/headers' cookies(); outside a
 * real Next.js request that throws. We mock it with a mutable in-memory
 * cookie jar so tests can sign in by calling setSessionCookie() directly and
 * then invoke the actual handler functions.
 *
 * No DATABASE_URL is set in tests → src/db falls back to the in-memory
 * pg-mem instance, giving us a real SQL database per run.
 */
import { vi } from "vitest";

type CookieJar = Map<string, string>;

const globalState = globalThis as typeof globalThis & {
  __vfTestCookieJar?: CookieJar;
};

export function cookieJar(): CookieJar {
  if (!globalState.__vfTestCookieJar) globalState.__vfTestCookieJar = new Map();
  return globalState.__vfTestCookieJar;
}

vi.mock("next/headers", () => ({
  cookies: () => {
    const jar = cookieJar();
    const store = new Map(jar);
    return Promise.resolve({
      get: (name: string) => {
        const value = store.get(name);
        return value === undefined ? undefined : { name, value };
      },
      getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => {
        jar.set(name, value);
      },
      delete: (name: string) => {
        jar.delete(name);
      },
    });
  },
}));

export function clearCookies() {
  cookieJar().clear();
}
