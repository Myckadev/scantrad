// features/gallery/components/Gallery.tsx - Refactorisé avec API
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  Visibility,
  Compare,
  PlayArrow,
  Home,
} from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import { 
  useGetBatchResultQuery,
  getCurrentUser
} from '../../../app/services/api';
import GalleryStats from './GalleryStats';
import GalleryView from './GalleryView';
import ComparisonView from './ComparisonView';
import ReaderMode from './ReaderMode';
import PageViewer from './PageViewer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function Gallery() {
  const { batchId } = useParams();
  const [tabValue, setTabValue] = useState(0);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const currentUser = getCurrentUser();

  // Utiliser l'API de Mikael pour récupérer les données du batch
  const {
    data: batchResultResponse,
    isLoading,
    error,
    refetch
  } = useGetBatchResultQuery(batchId || '', {
    skip: !batchId || !currentUser,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openPageViewer = (page: any, index: number) => {
    if (page.status !== 'done') return;
    
    setSelectedPage(page);
    setCurrentPageIndex(index);
    setViewerOpen(true);
  };

  const closePageViewer = () => {
    setViewerOpen(false);
    setSelectedPage(null);
  };

  const navigateToPage = (direction: 'next' | 'prev') => {
    if (!transformedBatch) return;
    
    const newIndex = direction === 'next' 
      ? Math.min(currentPageIndex + 1, transformedBatch.pages.length - 1)
      : Math.max(currentPageIndex - 1, 0);
    
    setCurrentPageIndex(newIndex);
    setSelectedPage(transformedBatch.pages[newIndex]);
  };

  if (!currentUser) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" gutterBottom>
          🔐 Connexion requise
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Vous devez être connecté pour voir la galerie.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<Home />}
        >
          Retour à l'accueil
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" gutterBottom>
          🔄 Chargement de la galerie...
        </Typography>
        <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />
      </Box>
    );
  }

  if (error || !batchResultResponse) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" gutterBottom>
          📭 Erreur de chargement
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          {batchId ? `Impossible de charger le batch "${batchId}".` : 'Aucun batch spécifié.'}
        </Typography>
        <Button
          onClick={() => refetch()}
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Réessayer
        </Button>
        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<Home />}
        >
          Retour à l'accueil
        </Button>
      </Box>
    );
  }

  // Transformer les données de l'API vers le format attendu par les composants
  const transformedBatch = {
    id: batchId!,
    userId: currentUser,
    status: batchResultResponse.pages.every(p => p.status === 'done') ? 'done' : 'processing',
    totalPages: batchResultResponse.pages.length,
    completedPages: batchResultResponse.pages.filter(p => p.status === 'done').length,
    pages: batchResultResponse.pages.map(page => ({
      id: page.page_id,
      filename: page.filename,
      status: page.status,
      originalUrl: page.original_url,
      translatedUrl: page.translated_url,
      detectedBubbles: Math.floor(Math.random() * 10) + 1, // Mock jusqu'à ce que l'API le fournisse
      translatedTexts: [], // À remplir quand l'API le fournira
      processingTime: 8, // Mock - correspond aux 8 secondes de l'API
    }))
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header avec stats */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🖼️ Galerie - Batch {batchId?.slice(-8)}
        </Typography>
        
        <GalleryStats 
          batch={{
            id: transformedBatch.id,
            totalPages: transformedBatch.totalPages,
            completedPages: transformedBatch.completedPages,
            status: transformedBatch.status,
          }} 
          pages={transformedBatch.pages} 
        />

        {transformedBatch.status === 'done' ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✨ <strong>Traduction terminée !</strong> Vous pouvez maintenant visualiser et télécharger vos pages traduites.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            ⏳ <strong>Traitement en cours...</strong> {transformedBatch.completedPages} sur {transformedBatch.totalPages} pages terminées.
            <br />
            <Typography variant="caption">
              Les updates se font automatiquement en temps réel.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Tabs pour les différentes vues */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab icon={<Visibility />} label="Vue Galerie" />
          <Tab icon={<Compare />} label="Comparaison" />
          <Tab icon={<PlayArrow />} label="Mode Lecteur" />
        </Tabs>
      </Paper>

      {/* Vue Galerie */}
      <TabPanel value={tabValue} index={0}>
        <GalleryView
          pages={transformedBatch.pages}
          onPageClick={openPageViewer}
        />
      </TabPanel>

      {/* Vue Comparaison */}
      <TabPanel value={tabValue} index={1}>
        <ComparisonView pages={transformedBatch.pages} />
      </TabPanel>

      {/* Mode Lecteur */}
      <TabPanel value={tabValue} index={2}>
        <ReaderMode
          pages={transformedBatch.pages}
          onStartReading={openPageViewer}
        />
      </TabPanel>

      {/* Viewer modal */}
      {selectedPage && viewerOpen && (
        <PageViewer
          page={selectedPage}
          pages={transformedBatch.pages}
          currentIndex={currentPageIndex}
          isOpen={viewerOpen}
          onClose={closePageViewer}
          onNavigate={navigateToPage}
        />
      )}

      {/* Bouton retour */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          component={Link}
          to="/"
          variant="outlined"
          startIcon={<Home />}
          size="large"
        >
          Retour à l'accueil
        </Button>
      </Box>
    </Box>
  );
}

export default Gallery;