// features/gallery/components/GalleryView.tsx
// GalleryView.tsx - pas besoin d'import React
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
} from '@mui/material';
import {
  Fullscreen,
  Download,
  CheckCircle,
  PlayArrow,
} from '@mui/icons-material';

interface PageInfo {
  id: string;
  filename: string;
  status: string;
  originalUrl: string;
  translatedUrl?: string;
  detectedBubbles: number;
  processingTime: number;
}

interface GalleryViewProps {
  pages: PageInfo[];
  onPageClick: (page: PageInfo, index: number) => void;
}

function GalleryView({ pages, onPageClick }: GalleryViewProps) {
  const downloadPage = (page: PageInfo) => {
    console.log(`Téléchargement de ${page.filename}`);
    alert('Fonctionnalité de téléchargement en cours de développement');
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
      gap: '24px' 
    }}>
      {pages.map((page, index) => (
        <Card key={page.id} sx={{ position: 'relative', cursor: 'pointer' }}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="300"
              image={page.status === 'done' && page.translatedUrl ? page.translatedUrl : page.originalUrl}
              alt={page.filename}
              onClick={() => page.status === 'done' && onPageClick(page, index)}
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
                onClick={() => page.status === 'done' && onPageClick(page, index)}
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
      ))}
    </div>
  );
}

export default GalleryView;