"use client";

import { useEffect } from "react";

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

/**
 * Anonymous heartbeat for the admin's "live visitors" panel.
 * Pings /api/track every 25s with a stable per-device id. No personal data.
 */
export default function LiveTracker() {
  useEffect(() => {
    const id = sessionId();
    if (!id) return;
    let stopped = false;

    const ping = () => {
      if (stopped) return;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, path: window.location.pathname }),
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const id1 = setInterval(ping, 25000);
    const onVis = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopped = true;
      clearInterval(id1);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
