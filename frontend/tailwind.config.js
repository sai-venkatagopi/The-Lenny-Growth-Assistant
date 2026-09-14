/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F9F9F8",
          dark: "#F0EFEC",
          darker: "#E5E4E0",
        },
        teal: {
          DEFAULT: "#064E3B",
          light: "#0D6B52",
          lighter: "#10B981",
          muted: "#E8F5F0",
          darkMuted: "rgba(16, 185, 129, 0.15)",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
          light: "#9CA3AF",
        },
        slateCustom: {
          900: "#0B0F19",
          800: "#151C2C",
          700: "#1E293B",
          600: "#334155",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["DM Sans", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        "card-dark": "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)",
        premium: "0 4px 24px rgba(6, 78, 59, 0.1)",
        "premium-dark": "0 4px 24px rgba(16, 185, 129, 0.15)",
      },
    },
  },
  plugins: [],
};
