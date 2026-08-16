"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2, X } from "lucide-react";

/**
 * VisionFold Runner — a brand-themed endless runner (in the spirit of the
 * Chrome dino game). A little film camera sprints across a film-strip ground,
 * jumping over "8K render" bars. Space / ArrowUp / tap to jump, ArrowDown to duck.
 * High score persists in localStorage.
 */

const W = 900;
const H = 320;
const GROUND = 258;

const HIGH_SCORE_KEY = "vf-runner-highscore";

type Phase = "ready" | "playing" | "over";

interface Obstacle {
  x: number;
  w: number;
  h: number;
  type: "bar" | "double" | "tall";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

function GameCanvas({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => {
    try {
      return typeof localStorage === "undefined" ? 0 : Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
    } catch {
      return 0;
    }
  });
  const phaseRef = useRef<Phase>("ready");
  const bestRef = useRef(best);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    let speed = 6;
    let distance = 0;
    let vy = 0;
    let onGround = true;
    let ducking = false;
    let duckTimer = 0;
    let spawnAt = 0;
    let alive = true;
    let particles: Particle[] = [];

    // Player
    const px = 90;
    let py = GROUND; // baseline (top of player = GROUND - height)

    const obstacles: Obstacle[] = [];

    function jump() {
      if (phaseRef.current === "ready") {
        phaseRef.current = "playing";
        setPhase("playing");
      }
      if (phaseRef.current !== "playing") return;
      if (onGround) {
        vy = -12.2;
        onGround = false;
        ducking = false;
        burst(px + 15, GROUND - 10, 6);
      }
    }

    function duck(active: boolean) {
      if (phaseRef.current !== "playing") return;
      if (active && onGround) {
        ducking = true;
        vy = 6; // fast drop
      } else {
        ducking = false;
      }
    }

    function burst(x: number, y: number, n: number) {
      for (let i = 0; i < n; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5 - 2,
          vy: (Math.random() - 0.7) * 4,
          life: 24,
        });
      }
    }

    function reset() {
      obstacles.length = 0;
      particles.length = 0;
      speed = 6;
      distance = 0;
      vy = 0;
      onGround = true;
      ducking = false;
      alive = true;
      spawnAt = 0;
      setScore(0);
      phaseRef.current = "playing";
      setPhase("playing");
    }

    function die() {
      if (!alive) return;
      alive = false;
      phaseRef.current = "over";
      setPhase("over");
      const s = Math.floor(distance / 10);
      setScore(s);
      try {
        const prev = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
        if (s > prev) localStorage.setItem(HIGH_SCORE_KEY, String(s));
        setBest(Math.max(prev, s));
        bestRef.current = Math.max(prev, s);
      } catch {
        /* ignore */
      }
      burst(px + 15, py + 20, 18);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (phaseRef.current === "over") reset();
        else jump();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        duck(true);
      } else if (e.code === "Escape") {
        onClose();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") duck(false);
    };
    const onPointer = () => {
      if (phaseRef.current === "over") reset();
      else jump();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointer);

    const drawPlayer = () => {
      const h = ducking ? 26 : 44;
      const top = GROUND - h;
      const x = px;
      // Body (film camera)
      ctx.save();
      ctx.fillStyle = "#F4A62A";
      ctx.beginPath();
      ctx.roundRect(x, top, 34, h, 6);
      ctx.fill();
      // Film-strip stripe
      ctx.fillStyle = "#0A0A0B";
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + 5 + i * 9, top + 6, 4, 4);
      }
      // Lens
      ctx.fillStyle = "#F6F3EC";
      ctx.beginPath();
      ctx.arc(x + 26, top + (ducking ? 13 : 20), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0A0A0B";
      ctx.beginPath();
      ctx.arc(x + 26, top + (ducking ? 13 : 20), 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return h;
    }

    const drawObstacle = (o: Obstacle) => {
      const top = GROUND - o.h;
      ctx.save();
      // film-strip bar
      ctx.fillStyle = "#C97A12";
      ctx.beginPath();
      ctx.roundRect(o.x, top, o.w, o.h, 4);
      ctx.fill();
      ctx.fillStyle = "#0A0A0B";
      const holes = Math.max(1, Math.floor(o.w / 16));
      for (let i = 0; i < holes; i++) {
        ctx.fillRect(o.x + 6 + i * 14, top + 6, 5, 5);
        if (o.h > 40) ctx.fillRect(o.x + 6 + i * 14, top + o.h - 11, 5, 5);
      }
      // label
      ctx.fillStyle = "rgba(10,10,11,0.85)";
      ctx.fillRect(o.x, top - 16, o.w, 14);
      ctx.fillStyle = "#F6F3EC";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(o.type === "tall" ? "4K" : "8K", o.x + o.w / 2, top - 5);
      ctx.restore();
    }

    const loop = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      raf = requestAnimationFrame(loop);

      // Physics / world only advance while playing
      if (phaseRef.current === "playing") {
        speed = Math.min(15, 6 + distance / 2200);
        distance += speed;

        // gravity
        if (!onGround) {
          vy += 0.72;
          py += vy;
          if (py >= GROUND) {
            py = GROUND;
            onGround = true;
            vy = 0;
            burst(px + 15, GROUND - 8, 4);
          }
        } else if (ducking) {
          duckTimer += dt;
          if (duckTimer > 600) {
            ducking = false;
            duckTimer = 0;
          }
        }

        // spawn obstacles
        spawnAt -= speed;
        if (spawnAt <= 0) {
          const roll = Math.random();
          const type: Obstacle["type"] = roll < 0.55 ? "bar" : roll < 0.8 ? "double" : "tall";
          const w = type === "double" ? 24 : 20 + Math.random() * 14;
          const h = type === "tall" ? 56 + Math.random() * 12 : type === "double" ? 40 : 34 + Math.random() * 10;
          obstacles.push({ x: W + 20, w, h, type });
          spawnAt = 240 + Math.random() * 240 - Math.min(120, speed * 6);
        }

        // move + collide (AABB)
        const ph = ducking ? 26 : 44;
        const playerTop = GROUND - ph;
        const playerBottom = GROUND;
        for (const o of obstacles) {
          o.x -= speed;
          const obsTop = GROUND - o.h;
          const obsBottom = GROUND;
          if (
            o.x < px + 30 &&
            o.x + o.w > px + 4 &&
            playerBottom > obsTop &&
            playerTop < obsBottom
          ) {
            die();
          }
        }
        while (obstacles.length && obstacles[0].x + obstacles[0].w < -30) obstacles.shift();

        // particles
        particles = particles.filter((p) => (p.life -= 1) > 0);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18;
        }
      } else if (phaseRef.current === "over") {
        particles = particles.filter((p) => (p.life -= 1) > 0);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18;
        }
      }

      // ---- DRAW ----
      ctx.clearRect(0, 0, W, H);
      // bg
      ctx.fillStyle = "#0A0A0B";
      ctx.fillRect(0, 0, W, H);
      // stars
      ctx.fillStyle = "rgba(244,166,42,0.5)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 197 + 31) % W;
        const sy = (i * 89 + 13) % 160;
        const tw = 0.4 + 0.6 * Math.sin(now / 400 + i);
        ctx.globalAlpha = 0.25 + tw * 0.35;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;

      // ground
      ctx.strokeStyle = "rgba(244,166,42,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();
      // moving film-strip dashes
      const offset = -((distance * 1.5) % 30);
      ctx.fillStyle = "rgba(244,166,42,0.35)";
      for (let x = offset; x < W; x += 30) {
        ctx.fillRect(x, GROUND + 6, 14, 3);
      }

      // obstacles
      for (const o of obstacles) drawObstacle(o);
      // player
      drawPlayer();
      // particles
      ctx.fillStyle = "#F4A62A";
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / 24);
        ctx.fillRect(p.x, p.y, 4, 4);
      }
      ctx.globalAlpha = 1;

      // score HUD
      ctx.fillStyle = "#F6F3EC";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`SCORE ${Math.floor(distance / 10)}`, W - 20, 30);
      ctx.fillStyle = "rgba(246,243,236,0.5)";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`BEST ${bestRef.current}`, W - 20, 46);

      // overlays
      if (phaseRef.current === "ready") {
        ctx.fillStyle = "rgba(10,10,11,0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = "#F4A62A";
        ctx.font = "bold 30px monospace";
        ctx.fillText("VISIONFOLD RUNNER", W / 2, 120);
        ctx.fillStyle = "#F6F3EC";
        ctx.font = "14px monospace";
        ctx.fillText("Jump the render bars. Survive the deadline.", W / 2, 150);
        ctx.fillText("SPACE / ↑ / TAP to jump · ↓ to duck", W / 2, 176);
        ctx.fillStyle = "#F4A62A";
        ctx.font = "bold 13px monospace";
        ctx.fillText("▶ press SPACE to start", W / 2, 210);
      } else if (phaseRef.current === "over") {
        ctx.fillStyle = "rgba(10,10,11,0.74)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = "#F4A62A";
        ctx.font = "bold 28px monospace";
        ctx.fillText("CUT!", W / 2, 120);
        ctx.fillStyle = "#F6F3EC";
        ctx.font = "18px monospace";
        ctx.fillText(`Final cut: ${score}`, W / 2, 156);
        ctx.fillStyle = "rgba(246,243,236,0.6)";
        ctx.font = "13px monospace";
        ctx.fillText(`Best: ${best}${score >= best && score > 0 ? "  ·  NEW BEST" : ""}`, W / 2, 180);
        ctx.fillStyle = "#F4A62A";
        ctx.font = "bold 13px monospace";
        ctx.fillText("SPACE / TAP to re-render", W / 2, 214);
      }
    }

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, [onClose]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="w-full cursor-pointer rounded-xl border border-brand-400/30 shadow-[0_0_60px_-20px_rgba(244,166,42,0.6)]"
      style={{ touchAction: "manipulation" }}
    />
  );
}

export default function VisionRunner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Play VisionFold Runner"
        title="Play VisionFold Runner — jump the render bars!"
        className="group fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-brand-400/40 bg-black/70 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-brand-300 shadow-[0_0_30px_-10px_rgba(244,166,42,0.7)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-brand-400 hover:bg-black/90 hover:text-white"
      >
        <Gamepad2 size={16} className="animate-pulseglow" />
        <span className="hidden sm:inline">Play</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="animate-page-in w-full max-w-3xl rounded-3xl border border-brand-400/30 bg-[#0A0A0B] p-5 shadow-2xl sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                  VisionFold <span className="text-gradient">Runner</span>
                </h3>
                <p className="text-xs text-slate-400">
                  A quick creative sprint — jump the render bars. High score is saved on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close game"
                className="rounded-xl border border-white/10 p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <GameCanvas onClose={() => setOpen(false)} />
            <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-slate-500">
              Space / ↑ / tap = jump · ↓ = duck · Esc = close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
