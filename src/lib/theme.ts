import { useColorScheme } from "react-native";

// ─── Spacing Scale (4-point grid) ───────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border Radii ───────────────────────────────────────────────────────────
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────
export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
  },
} as const;

// ─── Color Tokens ───────────────────────────────────────────────────────────
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderFocused: string;

  primary: string;
  primaryPressed: string;
  primarySubtle: string;

  textPrimary: string;
  textSecondary: string;
  textPlaceholder: string;
  textOnPrimary: string;

  danger: string;
  dangerSubtle: string;
  dangerText: string;

  success: string;
  successSubtle: string;

  headerBackground: string;
  headerText: string;
  headerBorder: string;
};

const darkColors: ThemeColors = {
  background: "#0F1117",
  surface: "#1A1D27",
  surfaceElevated: "#242836",
  border: "#2E3345",
  borderFocused: "#3B82F6",

  primary: "#3B82F6",
  primaryPressed: "#2563EB",
  primarySubtle: "rgba(59,130,246,0.12)",

  textPrimary: "#F1F3F9",
  textSecondary: "#8B93A7",
  textPlaceholder: "#4A5168",
  textOnPrimary: "#FFFFFF",

  danger: "#EF4444",
  dangerSubtle: "rgba(239,68,68,0.12)",
  dangerText: "#FCA5A5",

  success: "#22C55E",
  successSubtle: "rgba(34,197,94,0.12)",

  headerBackground: "#151722",
  headerText: "#F1F3F9",
  headerBorder: "#2E3345",
};

const lightColors: ThemeColors = {
  background: "#F5F7FA",
  surface: "#FFFFFF",
  surfaceElevated: "#F0F2F7",
  border: "#E2E5ED",
  borderFocused: "#3B82F6",

  primary: "#3B82F6",
  primaryPressed: "#2563EB",
  primarySubtle: "rgba(59,130,246,0.08)",

  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textPlaceholder: "#9CA3AF",
  textOnPrimary: "#FFFFFF",

  danger: "#EF4444",
  dangerSubtle: "rgba(239,68,68,0.08)",
  dangerText: "#DC2626",

  success: "#16A34A",
  successSubtle: "rgba(34,197,94,0.08)",

  headerBackground: "#FFFFFF",
  headerText: "#111827",
  headerBorder: "#E2E5ED",
};

// ─── Shadows ────────────────────────────────────────────────────────────────
const cardShadowLight = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
} as const;

const cardShadowStrongLight = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

const noShadow = {} as const;

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? darkColors : lightColors;
  const shadows = {
    card: isDark ? noShadow : cardShadowLight,
    cardStrong: isDark ? noShadow : cardShadowStrongLight,
  };

  return { colors, isDark, shadows };
}
