import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#667085",
        surface: "#F4F7FA",
        panel: "#FFFFFF",
        line: "#D8DEE8",
        techBg: "#F7F8FF",
        techFg: "#101828",
        techMuted: "#667085",
        techSurface: "#FFFFFF",
        techSurface2: "#F1F5F7",
        techLine: "#D8DEE8",
        navy: "#090A12",
        primary: "#35F2B9",
        primaryDark: "#25CFA0",
        primarySoft: "#142F34",
        ai: "#8C7CFF",
        aiSoft: "#171633",
        success: "#157F3B",
        warning: "#B7791F",
        danger: "#B42318",
        info: "#2563EB",
        teal: "#35F2B9",
        amber: "#B7791F",
        coral: "#C2410C"
      },
      boxShadow: {
        soft: "0 16px 50px rgba(17, 24, 39, 0.08)",
        panel: "0 1px 2px rgba(16, 24, 40, 0.05), 0 12px 32px rgba(16, 24, 40, 0.06)",
        focus: "0 0 0 4px rgba(53, 242, 185, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
