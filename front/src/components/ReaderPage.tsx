// components/ReaderPage.tsx
import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  MenuBook,
  PlayArrow,
  CloudUpload,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

function ReaderPage() {
  return (
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
  );
}

export default ReaderPage;