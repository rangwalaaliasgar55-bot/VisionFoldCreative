import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "#050505",
        midnight: "#0a0a0f",
        surface: "#111118",
        surfaceHighlight: "#1a1a24",
        accent: { DEFAULT: "#6366f1", glow: "#818cf8", dim: "#4338ca" },
        coral: "#f43f5e",
        amber: "#f59e0b",
        cyan: "#06b6d4",
        emerald: "#10b981",
        rose: "#e11d48",
        slate: { 850: "#1e293b" },
      },
      fontFamily: {
        display: ["'Clash Display'", "'Inter'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-20px)" } },
        "pulse-glow": { "0%,100%": { opacity: "0.4", transform: "scale(1)" }, "50%": { opacity: "0.8", transform: "scale(1.05)" } },
        "gradient-x": { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};

export default config;
