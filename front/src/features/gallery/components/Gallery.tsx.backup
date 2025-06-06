import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogContent,
  Slider,
  Stack,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Visibility,
  Download,
  Compare,
  Fullscreen,
  FullscreenExit,
  Close,
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  Home,
  PlayArrow,
  CheckCircle,
  Settings,
  Bookmark,
  Info,
} from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import { batchStore } from '../../../utils/batchStore';
import type { ProcessedPage, Batch } from '../../../utils/batchStore';

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
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedPage, setSelectedPage] = useState<ProcessedPage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [compareMode, setCompareMode] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // Auto-hide controls
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Touch/swipe states
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    // Charger les données réelles du batch
    setLoading(true);
    
    if (batchId) {
      const foundBatch = batchStore.getBatch(batchId);
      if (foundBatch) {
        setBatch(foundBatch);
      } else {
        // Si aucun batch trouvé, afficher un message d'erreur
        setBatch(null);
      }
    } else {
      // Si pas de batchId, prendre le plus récent
      const recentBatches = batchStore.getAllBatches();
      if (recentBatches.length > 0) {
        setBatch(recentBatches[0]);
      }
    }
    
    setLoading(false);
  }, [batchId]);

  // Rafraîchir automatiquement si le batch est en cours de traitement
  useEffect(() => {
    if (!batch || batch.status === 'done') return;

    const interval = setInterval(() => {
      if (batchId) {
        const updatedBatch = batchStore.getBatch(batchId);
        if (updatedBatch) {
          setBatch(updatedBatch);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [batch, batchId]);

  // Contrôles clavier
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!dialogOpen || !batch) return;

    switch (event.key) {
      case 'ArrowRight':
      case ' ': // Espace
        event.preventDefault();
        nextPage();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        previousPage();
        break;
      case 'Escape':
        event.preventDefault();
        closeDialog();
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        toggleFullscreen();
        break;
      case 'c':
      case 'C':
        event.preventDefault();
        setCompareMode(!compareMode);
        break;
      case '+':
      case '=':
        event.preventDefault();
        setZoom(Math.min(200, zoom + 25));
        break;
      case '-':
        event.preventDefault();
        setZoom(Math.max(50, zoom - 25));
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        setZoom(100);
        break;
      case 'i':
      case 'I':
        event.preventDefault();
        setShowInfo(!showInfo);
        break;
      case 'b':
      case 'B':
        event.preventDefault();
        setBookmarked(!bookmarked);
        break;
    }
  }, [dialogOpen, compareMode, zoom, showInfo, bookmarked, batch]);

  // Gestion du scroll de la molette pour zoom
  const handleWheel = useCallback((event: WheelEvent) => {
    if (!dialogOpen || !event.ctrlKey) return;
    
    event.preventDefault();
    const delta = event.deltaY > 0 ? -25 : 25;
    setZoom(prev => Math.max(50, Math.min(200, prev + delta)));
  }, [dialogOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [handleKeyPress, handleWheel]);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  useEffect(() => {
    if (dialogOpen) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [dialogOpen]);

  // Touch handlers pour swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextPage();
    } else if (isRightSwipe) {
      previousPage();
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openPageDialog = (page: ProcessedPage, index: number) => {
    setSelectedPage(page);
    setCurrentPageIndex(index);
    setDialogOpen(true);
    setZoom(100);
    setCompareMode(false);
    setIsFullscreen(false);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedPage(null);
    setCompareMode(false);
    setIsFullscreen(false);
    if (controlsTimeout) clearTimeout(controlsTimeout);
  };

  const nextPage = () => {
    if (!batch || currentPageIndex >= batch.pages.length - 1) return;
    const newIndex = currentPageIndex + 1;
    setCurrentPageIndex(newIndex);
    setSelectedPage(batch.pages[newIndex]);
    resetControlsTimeout();
  };

  const previousPage = () => {
    if (!batch || currentPageIndex <= 0) return;
    const newIndex = currentPageIndex - 1;
    setCurrentPageIndex(newIndex);
    setSelectedPage(batch.pages[newIndex]);
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const downloadPage = (page: ProcessedPage) => {
    console.log(`Téléchargement de ${page.filename}`);
  };

  const downloadAll = () => {
    console.log('Téléchargement de toutes les pages...');
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" gutterBottom>
          🔄 Chargement de la galerie...
        </Typography>
        <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />
      </Box>
    );
  }

  if (!batch) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" gutterBottom>
          📭 Aucun batch trouvé
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          {batchId ? `Le batch "${batchId}" n'existe pas ou a été supprimé.` : 'Aucun chapitre traduit disponible.'}
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

  const completedPages = batch.pages.filter(p => p.status === 'done').length;
  const totalBubbles = batch.pages.reduce((sum, p) => sum + p.detectedBubbles, 0);
  const avgProcessingTime = batch.pages.reduce((sum, p) => sum + p.processingTime, 0) / batch.pages.length;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header avec stats */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🖼️ Galerie - Batch {batch.id.slice(-8)}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {completedPages}/{batch.pages.length}
              </Typography>
              <Typography variant="caption">Pages traduites</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="secondary">
                {totalBubbles}
              </Typography>
              <Typography variant="caption">Bulles détectées</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {avgProcessingTime > 0 ? avgProcessingTime.toFixed(1) : 0}s
              </Typography>
              <Typography variant="caption">Temps moyen</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                size="small" 
                onClick={downloadAll}
                startIcon={<Download />}
                fullWidth
                disabled={completedPages === 0}
              >
                Télécharger tout
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {batch.status === 'done' ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✨ <strong>Traduction terminée !</strong> Vous pouvez maintenant visualiser et télécharger vos pages traduites.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            ⏳ <strong>Traitement en cours...</strong> {completedPages} sur {batch.pages.length} pages terminées.
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
        <Grid container spacing={3}>
          {batch.pages.map((page, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={page.id}>
              <Card sx={{ position: 'relative', cursor: 'pointer' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={page.status === 'done' && page.translatedUrl ? page.translatedUrl : page.originalUrl}
                    alt={page.filename}
                    onClick={() => page.status === 'done' && openPageDialog(page, index)}
                    sx={{ 
                      objectFit: 'cover',
                      opacity: page.status === 'done' ? 1 : 0.7,
                      transition: 'transform 0.2s', 
                      '&:hover': page.status === 'done' ? { transform: 'scale(1.02)' } : {}
                    }}
                  />
                  <Chip
                    label={page.status === 'done' ? 'Traduit' : page.status === 'processing' ? 'En cours' : 'En attente'}
                    color={page.status === 'done' ? 'success' : page.status === 'processing' ? 'primary' : 'default'}
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    icon={page.status === 'done' ? <CheckCircle /> : <PlayArrow />}
                  />
                </Box>
                <CardContent>
                  <Typography variant="subtitle2" noWrap>
                    {page.filename}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {page.detectedBubbles > 0 ? `${page.detectedBubbles} bulles` : 'Analyse en cours'} 
                    {page.processingTime > 0 && ` • ${page.processingTime}s`}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      onClick={() => page.status === 'done' && openPageDialog(page, index)}
                      startIcon={<Fullscreen />}
                      disabled={page.status !== 'done'}
                    >
                      Voir
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => downloadPage(page)}
                      startIcon={<Download />}
                      disabled={page.status !== 'done'}
                    >
                      DL
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Vue Comparaison */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {batch.pages.filter(p => p.status === 'done').map((page, index) => (
            <Grid item xs={12} key={page.id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Page {batch.pages.indexOf(page) + 1} - {page.filename}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      🔍 Original
                    </Typography>
                    <img 
                      src={page.originalUrl} 
                      alt="Original"
                      style={{ width: '100%', maxHeight: 400, objectFit: 'contain', border: '1px solid #ddd' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      ✨ Traduit
                    </Typography>
                    <img 
                      src={page.translatedUrl} 
                      alt="Traduit"
                      style={{ width: '100%', maxHeight: 400, objectFit: 'contain', border: '1px solid #4caf50' }}
                    />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  📝 Textes traduits détectés :
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {page.translatedTexts.map((text, i) => (
                    <Chip key={i} label={text} variant="outlined" size="small" />
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {batch.pages.filter(p => p.status === 'done').length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
            Aucune page traduite à comparer pour le moment.
          </Typography>
        )}
      </TabPanel>

      {/* Mode Lecteur */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            📖 Mode Lecteur Avancé
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Navigation page par page en plein écran avec contrôles avancés
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="subtitle2" gutterBottom>⌨️ Raccourcis clavier :</Typography>
            <Typography variant="caption" component="div">
              • <strong>Flèches / Espace</strong> : Navigation<br/>
              • <strong>F</strong> : Plein écran<br/>
              • <strong>C</strong> : Mode comparaison<br/>
              • <strong>+/-</strong> : Zoom<br/>
              • <strong>R</strong> : Reset zoom<br/>
              • <strong>I</strong> : Infos page<br/>
              • <strong>B</strong> : Marque-page<br/>
              • <strong>Échap</strong> : Fermer
            </Typography>
          </Alert>
          
          <Button 
            variant="contained" 
            size="large"
            onClick={() => {
              const firstCompletedPage = batch.pages.find(p => p.status === 'done');
              if (firstCompletedPage) {
                const index = batch.pages.indexOf(firstCompletedPage);
                openPageDialog(firstCompletedPage, index);
              }
            }}
            startIcon={<PlayArrow />}
            disabled={completedPages === 0}
          >
            {completedPages > 0 ? 'Commencer la lecture' : 'Aucune page traduite'}
          </Button>
        </Paper>
      </TabPanel>

      {/* Dialog lecteur amélioré */}
      {selectedPage && (
        <Dialog 
          open={dialogOpen} 
          onClose={closeDialog} 
          maxWidth={false}
          fullWidth
          PaperProps={{ sx: { height: '100vh', m: 0, bgcolor: 'black' } }}
          onMouseMove={resetControlsTimeout}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'black' }}>
            {/* Barre d'outils (auto-hide) */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              p: 2, 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              transform: showControls ? 'translateY(0)' : 'translateY(-100%)',
              transition: 'transform 0.3s ease'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" color="white">
                  Page {currentPageIndex + 1} / {batch.pages.length}
                </Typography>
                <Typography variant="body2" color="grey.300">
                  {selectedPage.filename}
                </Typography>
                {bookmarked && (
                  <Chip 
                    icon={<Bookmark />} 
                    label="Favori" 
                    size="small" 
                    color="warning"
                  />
                )}
              </Box>
              
              <Stack direction="row" spacing={1}>
                <Tooltip title="Infos (I)">
                  <IconButton onClick={() => setShowInfo(!showInfo)} sx={{ color: 'white' }}>
                    <Info />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Marque-page (B)">
                  <IconButton 
                    onClick={() => setBookmarked(!bookmarked)} 
                    sx={{ color: bookmarked ? 'warning.main' : 'white' }}
                  >
                    <Bookmark />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Comparaison (C)">
                  <IconButton 
                    onClick={() => setCompareMode(!compareMode)} 
                    sx={{ color: compareMode ? 'primary.main' : 'white' }}
                  >
                    <Compare />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom - (-)">
                  <IconButton onClick={() => setZoom(Math.max(50, zoom - 25))} sx={{ color: 'white' }}>
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center', lineHeight: '40px', color: 'white' }}>
                  {zoom}%
                </Typography>
                <Tooltip title="Zoom + (+)">
                  <IconButton onClick={() => setZoom(Math.min(200, zoom + 25))} sx={{ color: 'white' }}>
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Plein écran (F)">
                  <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Fermer (Échap)">
                  <IconButton onClick={closeDialog} sx={{ color: 'white' }}>
                    <Close />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Infos flottantes */}
            {showInfo && (
              <Paper sx={{ 
                position: 'absolute',
                top: 80,
                right: 20,
                p: 2,
                zIndex: 1000,
                maxWidth: 300,
                bgcolor: 'rgba(0,0,0,0.8)',
                color: 'white'
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Informations de la page
                </Typography>
                <Typography variant="caption" component="div">
                  • Bulles détectées: {selectedPage.detectedBubbles}<br/>
                  • Temps de traitement: {selectedPage.processingTime}s<br/>
                  • Statut: {selectedPage.status}<br/>
                  • Textes traduits: {selectedPage.translatedTexts.length}
                </Typography>
              </Paper>
            )}

            {/* Contenu principal */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              p: 2,
              bgcolor: 'black'
            }}>
              {compareMode ? (
                <Grid container spacing={2} sx={{ height: '100%' }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom color="white">Original</Typography>
                      <img 
                        src={selectedPage.originalUrl} 
                        alt="Original"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '70vh', 
                          transform: `scale(${zoom / 100})`,
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom color="white">Traduit</Typography>
                      <img 
                        src={selectedPage.translatedUrl} 
                        alt="Traduit"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '70vh', 
                          transform: `scale(${zoom / 100})`,
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <img 
                  src={selectedPage.translatedUrl} 
                  alt={selectedPage.filename}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '90vh', 
                    transform: `scale(${zoom / 100})`,
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>

            {/* Navigation (auto-hide) */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              p: 2,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
              transform: showControls ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s ease'
            }}>
              <IconButton 
                onClick={previousPage} 
                disabled={currentPageIndex === 0}
                size="large"
                sx={{ color: 'white' }}
              >
                <NavigateBefore />
              </IconButton>
              <Slider
                value={currentPageIndex}
                min={0}
                max={batch.pages.length - 1}
                step={1}
                onChange={(_, value) => {
                  const newIndex = value as number;
                  setCurrentPageIndex(newIndex);
                  setSelectedPage(batch.pages[newIndex]);
                }}
                sx={{ 
                  mx: 3, 
                  width: 200,
                  '& .MuiSlider-thumb': { color: 'white' },
                  '& .MuiSlider-track': { color: 'white' },
                  '& .MuiSlider-rail': { color: 'rgba(255,255,255,0.3)' }
                }}
              />
              <IconButton 
                onClick={nextPage} 
                disabled={currentPageIndex === batch.pages.length - 1}
                size="large"
                sx={{ color: 'white' }}
              >
                <NavigateNext />
              </IconButton>
            </Box>

            {/* Bouton pour afficher les contrôles */}
            {!showControls && (
              <Fab
                size="small"
                onClick={resetControlsTimeout}
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                <Settings />
              </Fab>
            )}
          </DialogContent>
        </Dialog>
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