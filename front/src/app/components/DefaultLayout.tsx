import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Box } from "@mui/material";

export function DefaultLayout() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box >
        <Outlet />
      </Box>
    </Box>
  );
}