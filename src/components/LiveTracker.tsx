"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "vf_visit_id";

function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function utmFromLocation() {
  try {
    const q = new URLSearchParams(window.location.search);
    return {
      utmSource: q.get("utm_source") || "",
      utmMedium: q.get("utm_medium") || "",
      utmCampaign: q.get("utm_campaign") || "",
    };
  } catch {
    return { utmSource: "", utmMedium: "", utmCampaign: "" };
  }
}

/**
 * Accurate public-site tracker.
 * - One pageview per path change
 * - Heartbeats every 25s (do not inflate views)
 * - Duration on hide/unload
 * - UTM + referrer captured once per session
 */
export default function LiveTracker() {
  const pathname = usePathname() || "/";
  const started = useRef(0);
  const lastPath = useRef("");

  useEffect(() => {
    const id = sessionId();
    if (!id) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/portal") || pathname.startsWith("/api")) return;

    let stopped = false;
    const utm = utmFromLocation();

    const send = (kind: "view" | "heartbeat" | "exit") => {
      if (stopped && kind !== "exit") return;
      const payload = JSON.stringify({
        id,
        path: pathname,
        referrer: document.referrer || "",
        title: document.title || "",
        lang: navigator.language || "",
        kind,
        durationMs: Date.now() - started.current,
        ...utm,
      });
      if (kind === "exit" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
        return;
      }
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    };

    const isNewView = lastPath.current !== pathname;
    lastPath.current = pathname;
    if (isNewView) started.current = Date.now();
    send(isNewView ? "view" : "heartbeat");

    const beat = setInterval(() => send("heartbeat"), 25000);
    const onVis = () => {
      if (document.visibilityState === "visible") send("heartbeat");
      else send("exit");
    };
    const onHide = () => send("exit");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);

    return () => {
      stopped = true;
      clearInterval(beat);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, [pathname]);

  return null;
}
