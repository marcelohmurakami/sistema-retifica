import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={12}
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          backdropFilter: "blur(10px)",
          background: "rgba(30,30,30,0.85)",
          color: "#fff",
          borderRadius: "12px",
          padding: "14px 16px",
          fontSize: "14px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        },

        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#fff",
          },
          style: {
            borderLeft: "4px solid #22c55e",
          },
        },

        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
          style: {
            borderLeft: "4px solid #ef4444",
          },
        },
      }}
    />
  );
}