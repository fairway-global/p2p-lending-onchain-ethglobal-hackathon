/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Celo Brand Colors
        celo: {
          yellow: "#FCFF52",
          "forest-green": "#4E632A",
          purple: "#1A0329",
          "light-tan": "#FBF6F1",
          "dark-tan": "#E6E3D5",
          brown: "#635949",
          // Accent Pops
          "light-blue": "#8AC0F9",
          orange: "#F29E5F",
          pink: "#F2A9E7",
          lime: "#B2EBA1",
          // Functional
          success: "#329F3B",
          error: "#E70532",
          inactive: "#9B9B9B",
          "body-copy": "#666666",
        },
        border: "#CCCCCC",
        input: "#E6E3D5",
        ring: "#1A0329",
        background: "#FBF6F1",
        foreground: "#000000",
        primary: {
          DEFAULT: "#FCFF52",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1A0329",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#E70532",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#E6E3D5",
          foreground: "#635949",
        },
        accent: {
          DEFAULT: "#4E632A",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        card: {
          DEFAULT: "#E6E3D5",
          foreground: "#000000",
        },
      },
      fontFamily: {
        alpina: ["GT Alpina", "serif"],
        inter: ["Inter", "sans-serif"],
      },
      fontSize: {
        "h1": ["72px", { lineHeight: "84px", letterSpacing: "-0.01em", fontWeight: "250" }],
        "h2": ["54px", { lineHeight: "72px", letterSpacing: "-0.01em", fontWeight: "250" }],
        "h3": ["48px", { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "250" }],
        "h4": ["40px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "250" }],
        "body-l": ["20px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "250" }],
        "body-m": ["16px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "250" }],
        "body-s": ["14px", { lineHeight: "18px", letterSpacing: "-0.01em", fontWeight: "250" }],
        "eyebrow": ["12px", { lineHeight: "16px", letterSpacing: "0em", fontWeight: "750" }],
      },
      borderRadius: {
        DEFAULT: "0",
        none: "0",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
