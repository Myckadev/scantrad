// features/gallery/components/PageViewer.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  Compare,
} from '@mui/icons-material';

interface PageInfo {
  id: string;
  filename: string;
  originalUrl: string;
  translatedUrl?: string;
}

interface PageViewerProps {
  page: PageInfo;
  pages: PageInfo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
}

function PageViewer({
  page,
  pages,
  currentIndex,
  isOpen,
  onClose,
  onNavigate
}: PageViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [compareMode, setCompareMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Contrôles clavier
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        if (currentIndex < pages.length - 1) {
          onNavigate('next');
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentIndex > 0) {
          onNavigate('prev');
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
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
    }
  }, [isOpen, compareMode, zoom, currentIndex, pages.length, onNavigate, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < pages.length - 1;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: { height: '100vh', m: 0, bgcolor: 'black' } }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'black' }}>
        {/* Barre d'outils */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          background: 'rgba(0,0,0,0.8)',
          color: 'white'
        }}>
          <Typography variant="h6">
            Page {currentIndex + 1} / {pages.length} - {page.filename}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setCompareMode(!compareMode)} sx={{ color: 'white' }}>
              <Compare />
            </IconButton>
            <IconButton onClick={() => setZoom(Math.max(50, zoom - 25))} sx={{ color: 'white' }}>
              <ZoomOut />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center', lineHeight: '40px' }}>
              {zoom}%
            </Typography>
            <IconButton onClick={() => setZoom(Math.min(200, zoom + 25))} sx={{ color: 'white' }}>
              <ZoomIn />
            </IconButton>
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px', 
              height: '100%',
              width: '100%'
            }}>
              <div style={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                  Original
                </Typography>
                <img
                  src={page.originalUrl}
                  alt="Original"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    transform: `scale(${zoom / 100})`,
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                  Traduit
                </Typography>
                <img
                  src={page.translatedUrl}
                  alt="Traduit"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    transform: `scale(${zoom / 100})`,
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>
          ) : (
            <img
              src={page.translatedUrl}
              alt={page.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                transform: `scale(${zoom / 100})`,
                objectFit: 'contain'
              }}
            />
          )}
        </Box>

        {/* Navigation */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          background: 'rgba(0,0,0,0.8)'
        }}>
          <IconButton
            onClick={() => onNavigate('prev')}
            disabled={!canNavigatePrev}
            size="large"
            sx={{ color: 'white' }}
          >
            <NavigateBefore />
          </IconButton>
          <Typography variant="body1" sx={{ mx: 3, color: 'white' }}>
            {currentIndex + 1} / {pages.length}
          </Typography>
          <IconButton
            onClick={() => onNavigate('next')}
            disabled={!canNavigateNext}
            size="large"
            sx={{ color: 'white' }}
          >
            <NavigateNext />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default PageViewer;