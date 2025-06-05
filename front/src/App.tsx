// App.tsx refactorisé
import { useState } from 'react';
import {
  Typography,
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
} from "@mui/material";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { theme } from "./app/theme";
import Navigation from "./components/Navigation";
import BatchUpload from "./features/batchUpload/components/BatchUpload";
import Gallery from "./features/gallery/components/Gallery";
import ReaderPage from "./components/ReaderPage";

function App() {
  const [mockingStarted] = useState(true);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navigation />

          <Container maxWidth="lg" sx={{ 
            mt: 4, 
            mb: 4, 
            minHeight: 'calc(100vh - 200px)',
            mx: 'auto'
          }}>
            <Routes>
              <Route path="/" element={<BatchUpload />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/gallery/:batchId" element={<Gallery />} />
              <Route path="/reader/:batchId?" element={<ReaderPage />} />
            </Routes>
          </Container>

          {/* Footer avec status */}
          <Box sx={{
            mt: 'auto',
            py: 2,
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}>
            <Typography variant="caption" color="textSecondary">
              Made with ❤️ for manga translation • Projet Scan Trad
            </Typography>
          </Box>

          {/* Indicateur backend réel */}
          {mockingStarted && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 2,
                fontSize: '12px',
                zIndex: 1000,
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              🐳 Backend Docker Actif
            </Box>
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;