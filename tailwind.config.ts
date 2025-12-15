// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: "#6366f1",
          fuchsia: "#ec4899",
          violet: "#8b5cf6",
          // NOVAS CORES ADICIONADAS
          dark: "#080033",
          neon: "#4800E2",
          highlight: "#8E00FF",
        },
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glow: {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: 0.6 },
          "80%, 100%": { transform: "scale(1.6)", opacity: 0 },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        glow: "glow 2.5s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        pulseRing: "pulseRing 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;