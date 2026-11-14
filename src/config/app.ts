export const appConfig = {
  name: "DealersHub",

  description:
    "B2B wholesale commerce and dealer management SaaS.",

  locale: "en-IN",

  currency: "INR",

  theme: {
    primary: "#0B1220",
    raised: "#111B2E",
    accent: "#C6F432",
    accentHover: "#A8D91F",
    canvas: "#F8FAFC",
    surface: "#FFFFFF",
  },

  fonts: {
    sans: "Geist Variable",
    mono: "Geist Mono Variable",
  },
} as const;

export type AppConfig = typeof appConfig;