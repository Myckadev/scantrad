import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#EC407A", // rose manga
    },
    secondary: {
      main: "#00B8D4", // bleu flashy
    },
    background: {
      default: "#181C24", // fond sombre et classe
      paper: "#23283A",    // panels
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#A4A6B3",
    },
  },
  typography: {
    fontFamily: "'Montserrat', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    h6: {
      fontWeight: 700,
      letterSpacing: "0.04em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(90deg, #252850 0%, #EC407A 100%)",
          boxShadow: "0 4px 24px rgba(60,12,46,0.24)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          background: "rgba(19,21,31,0.95)",
          borderRadius: 18,
          padding: "24px 24px 40px",
        },
      },
    },
  },
});