import { Outlet } from "react-router"
import { Sidebar } from "../sidebar/Sidebar"
import { Grid, Main, Overlay } from "./styles"
import { Header } from "../header/Header"
import { useEffect, useState } from "react";

export function MainGrid() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    if (!isSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <Grid>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

      {isSidebarOpen && <Overlay onClick={() => setIsSidebarOpen(false)} />}

      <Main>
        <Outlet />
      </Main>
    </Grid>
  );
}
