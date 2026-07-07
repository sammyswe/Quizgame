/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#070b1e",
        deep: "#0d1233",
        deeper: "#0a0e28",
        card: "#131a45",
        neon: {
          cyan: "#22d3ee",
          gold: "#fbbf24",
          pink: "#f472b6",
          green: "#4ade80",
          purple: "#c084fc",
          red: "#fb7185",
        },
      },
      fontFamily: {
        display: ['"Lilita One"', "system-ui", "sans-serif"],
        body: ['"Nunito"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan": "0 0 12px rgba(34,211,238,0.55), 0 0 40px rgba(34,211,238,0.2)",
        "neon-gold": "0 0 12px rgba(251,191,36,0.55), 0 0 40px rgba(251,191,36,0.2)",
        "neon-pink": "0 0 12px rgba(244,114,182,0.55), 0 0 40px rgba(244,114,182,0.2)",
        "neon-green": "0 0 12px rgba(74,222,128,0.55), 0 0 40px rgba(74,222,128,0.2)",
        "neon-purple": "0 0 12px rgba(192,132,252,0.55), 0 0 40px rgba(192,132,252,0.2)",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        chestShake: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-6deg)" },
          "40%": { transform: "rotate(6deg)" },
          "60%": { transform: "rotate(-4deg)" },
          "80%": { transform: "rotate(4deg)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s ease-in-out infinite",
        floaty: "floaty 3s ease-in-out infinite",
        chestShake: "chestShake 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
