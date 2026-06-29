const baseTheme = {
    typography: {
        fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        weights: { regular: 400, medium: 500, semibold: 600, bold: 800 },

        sizes: {
        xs: "0.75rem",   // 12
        sm: "0.875rem",  // 14
        md: "1rem",      // 16
        lg: "1.125rem",  // 18
        xl: "1.25rem",   // 20
        "2xl": "1.5rem", // 24
        "3xl": "1.75rem",   // 32
        },

        lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.65,
        },
    },

    spacing: {
        1: "0.25rem", // 4
        2: "0.5rem",  // 8
        3: "0.75rem", // 12
        4: "1rem",    // 16
        5: "1.25rem", // 20
        6: "1.5rem",  // 24
        8: "2rem",    // 32
        10: "2.5rem", // 40
        12: "3rem",   // 48
    },

    radius: {
        sm: "10px",
        md: "14px",
        lg: "18px",
        pill: "999px",
    },

    layout: {
        sidebarWidth: "280px",
        headerHeight: "64px",
        containerMax: "1200px",
    },
}

export const lightTheme = {
    ...baseTheme,
    colors: {
        primaryDark: "#0F172A",
        primary: "#1E293B",
        accent: "#F97316",
        accentDark: "#EA580C",

        background: "#F1F5F9",
        surface: "#FFFFFF",
        border: "#E2E8F0",

        textPrimary: "#334155",
        textSecondary: "#64748B",

        success: "#22C55E",
        warning: "#EAB308",
        error: "#EF4444"
    },

    shadow: {
        sm: "0 1px 2px rgba(15, 23, 42, 0.08)",
        md: "0 6px 18px rgba(15, 23, 42, 0.10)",
    },
}

export const darkTheme = {
    ...baseTheme,
    colors: {
        primaryDark: "#F8FAFC",
        primary: "#E2E8F0",
        accent: "#F97316",
        accentDark: "#EA580C",

        background: "#0F172A",
        surface: "#1E293B",
        border: "#334155",

        textPrimary: "#E2E8F0",
        textSecondary: "#94A3B8",

        success: "#4ADE80",
        warning: "#FACC15",
        error: "#F87171"
    },

    shadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.35)",
        md: "0 10px 24px rgba(0, 0, 0, 0.35)",
    },
}

export const theme = lightTheme;
