import React, { useState } from 'react';
import { 
  Typography, 
  ThemeProvider, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Container, 
  Box,
  createTheme,
  Button,
  Stack
} from "@mui/material";
import { 
  BrowserRouter as Router, 
  Route, 
  Routes, 
  Link, 
  useNavigate,
  useLocation 
} from "react-router-dom";
import { 
  CloudUpload, 
  PhotoLibrary, 
  MenuBook,
  PlayArrow 
} from '@mui/icons-material';
import BatchUpload from "./features/batchUpload/components/BatchUpload";
import Gallery from "./features/gallery/components/Gallery";

// Thème MUI sombre et moderne
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64b5f6',
    },
    secondary: {
      main: '#ff7043',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    }
  }
});

function Navigation() {
  const location = useLocation();
  
  return (
    <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          🗾 Scan Trad - Traduction de Manga
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/"
            variant={location.pathname === '/' ? 'outlined' : 'text'}
            startIcon={<CloudUpload />}
          >
            Upload
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/gallery"
            variant={location.pathname.includes('/gallery') ? 'outlined' : 'text'}
            startIcon={<PhotoLibrary />}
          >
            Galerie
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/reader"
            variant={location.pathname.includes('/reader') ? 'outlined' : 'text'}
            startIcon={<MenuBook />}
          >
            Lecteur
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  const [mockingStarted] = useState(true);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navigation />

          <Container maxWidth="xl" sx={{ mt: 4, mb: 4, minHeight: 'calc(100vh - 200px)' }}>
            <Routes>
              <Route path="/" element={<BatchUpload />} />
              
              <Route path="/gallery/:batchId?" element={<Gallery />} />

              <Route path="/reader/:batchId?" element={
  <Box sx={{ textAlign: 'center', mt: 8 }}>
    <MenuBook sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
    <Typography variant="h4" gutterBottom>
      📖 Lecteur Scan Trad
    </Typography>
    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
      Choisissez un chapitre traduit pour commencer la lecture
    </Typography>
    <Button 
      variant="contained" 
      component={Link} 
      to="/gallery"
      size="large"
      startIcon={<PlayArrow />}
      sx={{ mr: 2 }}
    >
      Aller à la galerie
    </Button>
    <Button 
      variant="outlined" 
      component={Link} 
      to="/" 
      size="large"
      startIcon={<CloudUpload />}
    >
      Nouvel upload
    </Button>
  </Box>
} />
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

          {/* Indicateur mock backend */}
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
              🎭 Backend Mock Actif
            </Box>
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;