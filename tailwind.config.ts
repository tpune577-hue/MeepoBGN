import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["var(--font-nunito)", "sans-serif"],
      },
      colors: {
        bgn: {
          bg: "var(--bgn-bg)",
          surface: "var(--bgn-surface)",
          ink: "var(--bgn-ink)",
          muted: "var(--bgn-muted)",
          "on-bg": "var(--bgn-on-bg)",
          "muted-on-bg": "var(--bgn-muted-on-bg)",
          primary: "var(--bgn-primary)",
          "primary-hover": "var(--bgn-primary-hover)",
          "primary-soft": "var(--bgn-primary-soft)",
          accent: "var(--bgn-accent)",
          border: "var(--bgn-border)",
          blossom: "var(--bgn-blossom)",
          error: "var(--bgn-error)",
          "error-bg": "var(--bgn-error-bg)",
          success: "var(--bgn-success)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
