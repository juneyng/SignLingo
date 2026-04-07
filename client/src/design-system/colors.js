// SignLingo Design System — Color Tokens
// Import this in every component: import { COLORS } from '@/design-system/colors'

export const COLORS = {
  // Primary
  green: "#58CC02",
  greenDark: "#46A302",
  greenLight: "#E8F8D0",
  greenBg: "#58CC0212",

  // Secondary
  blue: "#1CB0F6",
  blueDark: "#1899D6",
  blueLight: "#D7F0FE",
  blueBg: "#1CB0F612",

  // Accent
  purple: "#CE82FF",
  purpleDark: "#B06EDC",
  purpleLight: "#F3E5FF",
  purpleBg: "#CE82FF12",

  // Feedback
  orange: "#FF9600",
  orangeDark: "#E08600",
  orangeBg: "#FF960018",

  red: "#FF4B4B",
  redDark: "#E03E3E",
  redBg: "#FF4B4B15",

  yellow: "#FFC800",
  yellowDark: "#E0A800",
  yellowBg: "#FFC80020",

  // Neutrals
  white: "#FFFFFF",
  bg: "#F7F7F7",
  gray50: "#FAFAFA",
  gray100: "#F0F0F0",
  gray200: "#E5E5E5",
  gray300: "#CDCDCD",
  gray400: "#AFAFAF",
  gray500: "#939393",
  gray600: "#777777",
  gray700: "#555555",
  gray800: "#3C3C3C",
  dark: "#1A1A2E",
};

// Semantic color mappings
export const SEMANTIC = {
  success: COLORS.green,
  successDark: COLORS.greenDark,
  error: COLORS.red,
  errorDark: COLORS.redDark,
  warning: COLORS.yellow,
  warningDark: COLORS.yellowDark,
  info: COLORS.blue,
  infoDark: COLORS.blueDark,
  xp: COLORS.orange,
  streak: COLORS.orange,
  ai: COLORS.purple,
};

// Accuracy thresholds
export const ACCURACY_COLOR = (score) => {
  if (score >= 80) return { color: COLORS.green, dark: COLORS.greenDark, bg: COLORS.greenBg, label: "Great!" };
  if (score >= 50) return { color: COLORS.yellow, dark: COLORS.yellowDark, bg: COLORS.yellowBg, label: "Almost!" };
  return { color: COLORS.red, dark: COLORS.redDark, bg: COLORS.redBg, label: "Try again" };
};
