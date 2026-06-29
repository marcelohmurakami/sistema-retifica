import { Outlet } from "react-router"
import { Sidebar } from "../sidebar/Sidebar"
import { Grid, Main, Overlay } from "./styles"
import { Header } from "../header/Header"
import { useState } from "react";

export function MainGrid() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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