import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#F2F2F7",
          secondary: "#FFFFFF",
          elevated: "#F9F9FB",
          hover: "#F2F2F7",
          active: "#E5E5EA",
        },
        border: {
          DEFAULT: "#E5E5EA",
          strong: "#D1D1D6",
        },
        text: {
          primary: "#1C1C1E",
          secondary: "#3C3C43",
          muted: "#8E8E93",
          subtle: "#C7C7CC",
        },
        accent: {
          DEFAULT: "#5856D6",
          hover: "#4A48C4",
          soft: "#EEEDFE",
          strong: "#3C3489",
        },
        green: {
          DEFAULT: "#34C759",
          soft: "#EAF3DE",
          text: "#27500A",
          icon: "#639922",
        },
        red: {
          DEFAULT: "#FF3B30",
          soft: "#FCEBEB",
          text: "#791F1F",
          icon: "#E24B4A",
        },
        amber: {
          DEFAULT: "#FF9500",
          soft: "#FAEEDA",
          text: "#633806",
          icon: "#BA7517",
        },
        blue: {
          DEFAULT: "#007AFF",
          soft: "#E6F1FB",
          text: "#0C447C",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'Inter Tight'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        ios: "14px",
        "ios-lg": "18px",
        "ios-xl": "22px",
      },
    },
  },
  plugins: [],
};
export default config;
