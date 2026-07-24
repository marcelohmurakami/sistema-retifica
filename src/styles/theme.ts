const baseTheme = {
  typography: {
    fontFamily:
      "'Segoe UI Variable Text', 'Segoe UI', Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    displayFamily:
      "'Segoe UI Variable Display', 'Segoe UI', Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    weights: { regular: 400, medium: 500, semibold: 650, bold: 760 },

    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "2rem",
    },

    lineHeights: {
      tight: 1.16,
      normal: 1.5,
      relaxed: 1.65,
    },
  },

  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
  },

  radius: {
    sm: "10px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    pill: "999px",
  },

  layout: {
    sidebarWidth: "272px",
    headerHeight: "76px",
    containerMax: "1600px",
  },
};

export const lightTheme = {
  ...baseTheme,
  colors: {
    primaryDark: "#151922",
    primary: "#242B36",
    accent: "#F26A2E",
    accentDark: "#D94C13",
    accentSoft: "#FFF0E8",

    background: "#F4F3EF",
    surface: "#FFFEFC",
    surfaceElevated: "#FFFFFF",
    border: "#E5E1D9",

    textPrimary: "#242832",
    textSecondary: "#6D727C",
    textMuted: "#92969E",

    success: "#14845A",
    warning: "#BB7706",
    error: "#D14343",
    info: "#2563EB",
  },

  shadow: {
    sm: "0 1px 2px rgba(20, 24, 32, 0.04), 0 5px 16px rgba(20, 24, 32, 0.05)",
    md: "0 16px 44px rgba(20, 24, 32, 0.09), 0 2px 8px rgba(20, 24, 32, 0.04)",
    lg: "0 28px 80px rgba(20, 24, 32, 0.15)",
  },
};

export const darkTheme = {
  ...baseTheme,
  colors: {
    primaryDark: "#F7F6F2",
    primary: "#E5E7EB",
    accent: "#FF7A3D",
    accentDark: "#F15A1A",
    accentSoft: "#392117",

    background: "#0B0F14",
    surface: "#121821",
    surfaceElevated: "#18202B",
    border: "#29323E",

    textPrimary: "#E9E7E2",
    textSecondary: "#A0A6AF",
    textMuted: "#777F8B",

    success: "#45C58A",
    warning: "#E7A72A",
    error: "#F17070",
    info: "#6EA1FF",
  },

  shadow: {
    sm: "0 2px 14px rgba(0, 0, 0, 0.22)",
    md: "0 18px 50px rgba(0, 0, 0, 0.34)",
    lg: "0 30px 90px rgba(0, 0, 0, 0.48)",
  },
};

export const theme = lightTheme;
