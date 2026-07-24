import { Toaster } from "react-hot-toast";
import { useTheme } from "styled-components";

export function AppToaster() {
  const theme = useTheme();

  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerStyle={{
        top: 18,
        right: 18,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          backdropFilter: "blur(16px)",
          background: theme.colors.surfaceElevated,
          color: theme.colors.textPrimary,
          borderRadius: "14px",
          padding: "13px 15px",
          fontSize: "13px",
          fontWeight: 600,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadow.lg,
        },

        success: {
          iconTheme: {
            primary: theme.colors.success,
            secondary: "#fff",
          },
          style: {
            borderLeft: `4px solid ${theme.colors.success}`,
          },
        },

        error: {
          iconTheme: {
            primary: theme.colors.error,
            secondary: "#fff",
          },
          style: {
            borderLeft: `4px solid ${theme.colors.error}`,
          },
        },
      }}
    />
  );
}
