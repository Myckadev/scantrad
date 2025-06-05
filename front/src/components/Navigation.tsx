// components/Navigation.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  PhotoLibrary,
  MenuBook,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

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

export default Navigation;