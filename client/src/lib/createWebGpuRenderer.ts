/**
 * WebGPU renderer factory for R3F / raw Three.
 * Production default remains WebGL unless the feature flag is on
 * AND the browser reports WebGPU availability.
 *
 * Enable for local testing:
 *   - URL: ?webgpu=1
 *   - env: VITE_WEBGPU=true
 *   - localStorage: visionfold:webgpu = "1"
 */
import type { WebGPURendererParameters } from "three/webgpu";

export type GlFactoryProps = Record<string, unknown>;

function readFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("webgpu") === "1" || q.get("webgpu") === "true") return true;
  } catch {
    /* ignore */
  }
  try {
    if (window.localStorage?.getItem("visionfold:webgpu") === "1") return true;
  } catch {
    /* ignore */
  }
  try {
    // Vite env (optional)
    // @ts-expect-error import.meta.env is injected by Vite
    if (import.meta.env?.VITE_WEBGPU === "true") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** True when the feature flag is on (does not check GPU support). */
export function isWebGpuFlagEnabled(): boolean {
  return readFlag();
}

/** Async capability check — safe to call from useEffect. */
export async function isWebGpuSupported(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    gpu?: { requestAdapter: () => Promise<unknown> };
  };
  if (!nav.gpu?.requestAdapter) return false;
  try {
    const adapter = await nav.gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

/**
 * R3F `gl` factory: creates and inits WebGPURenderer.
 * Only use when isWebGpuFlagEnabled() && await isWebGpuSupported().
 */
export async function createWebGpuRenderer(props: GlFactoryProps) {
  const { WebGPURenderer } = await import("three/webgpu");
  const renderer = new WebGPURenderer({
    ...(props as WebGPURendererParameters),
  });
  await renderer.init();
  return renderer;
}

/**
 * Decide whether FilmReel / Hero should use the WebGPU path this session.
 * Cached after first resolution.
 */
let cachedDecision: boolean | null = null;

export async function resolveWebGpuPath(): Promise<boolean> {
  if (cachedDecision !== null) return cachedDecision;
  if (!readFlag()) {
    cachedDecision = false;
    return false;
  }
  cachedDecision = await isWebGpuSupported();
  return cachedDecision;
}

export function resetWebGpuDecisionCache() {
  cachedDecision = null;
}
