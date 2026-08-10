/**
 * Frame budget helper for rAF / Three.js loops.
 * Reserve a fixed ms budget per frame; skip optional work when exhausted.
 */
export type FrameBudget = {
  /** ms allocated for app work this frame (before browser composite) */
  readonly budgetMs: number;
  /** Call at the start of each animation frame */
  begin: (now?: number) => void;
  /** Elapsed ms since begin() */
  elapsed: () => number;
  /** Remaining ms in the budget (never negative) */
  remaining: () => number;
  /** True when elapsed >= budget */
  exhausted: () => boolean;
  /**
   * Run `fn` only if enough budget remains.
   * Returns true if fn ran, false if skipped.
   */
  maybe: (fn: () => void, costMs?: number) => boolean;
  /**
   * Skip every Nth frame for optional work when under pressure.
   * level 0 = always, 1 = every other, 2 = every 4th, …
   */
  allowOptional: (level?: number) => boolean;
  /** EMA of full frame intervals (set via sampleInterval) */
  emaMs: () => number;
  sampleInterval: (now: number) => void;
  reset: () => void;
};

export function createFrameBudget(budgetMs = 12): FrameBudget {
  let start = 0;
  let frameIndex = 0;
  let lastIntervalTs = 0;
  let ema = 16.7;
  let pressure = 0; // 0..3 — rises when frames are late

  const now = () =>
    typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    budgetMs,

    begin(t?: number) {
      start = t ?? now();
      frameIndex += 1;
    },

    elapsed() {
      return now() - start;
    },

    remaining() {
      return Math.max(0, budgetMs - (now() - start));
    },

    exhausted() {
      return now() - start >= budgetMs;
    },

    maybe(fn, costMs = 0) {
      if (now() - start + costMs >= budgetMs) return false;
      fn();
      return true;
    },

    allowOptional(level = 0) {
      // Under pressure, skip more optional work
      const skip = Math.min(3, pressure + level);
      if (skip <= 0) return true;
      return frameIndex % (1 << skip) === 0;
    },

    emaMs() {
      return ema;
    },

    sampleInterval(t: number) {
      if (lastIntervalTs > 0) {
        const dt = t - lastIntervalTs;
        if (dt > 0 && dt < 100) {
          ema = ema * 0.9 + dt * 0.1;
          // Pressure ladder based on sustained frame time
          if (ema > 22) pressure = 3;
          else if (ema > 18) pressure = 2;
          else if (ema > 16) pressure = 1;
          else if (ema < 14) pressure = Math.max(0, pressure - 1);
        }
      }
      lastIntervalTs = t;
    },

    reset() {
      lastIntervalTs = 0;
      ema = 16.7;
      pressure = 0;
      frameIndex = 0;
    },
  };
}
