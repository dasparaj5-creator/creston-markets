import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "rgb(var(--color-navy) / <alpha-value>)",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E4C766",
          dark: "#B8942C",
        },
        electric: "#00D4FF",
        slate: {
          surface: "rgb(var(--color-slate-surface) / <alpha-value>)",
        },
        success: "#10B981",
        danger: "#EF4444",
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "hero-mesh":
          "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.15), transparent 40%), radial-gradient(circle at 80% 30%, rgba(0,212,255,0.12), transparent 40%), radial-gradient(circle at 50% 80%, rgba(212,175,55,0.08), transparent 50%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 20px rgba(212,175,55,0.25)",
        glass: "0 8px 32px rgba(0,0,0,0.35)",
      },
      backdropBlur: {
        glass: "12px",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
