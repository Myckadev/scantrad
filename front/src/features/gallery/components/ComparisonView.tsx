// features/gallery/components/ComparisonView.tsx
// ComparisonView.tsx - pas besoin d'import React
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';

interface PageInfo {
  id: string;
  filename: string;
  status: string;
  originalUrl: string;
  translatedUrl?: string;
  detectedBubbles: number;
  translatedTexts: string[];
  processingTime: number;
}

interface ComparisonViewProps {
  pages: PageInfo[];
}

function ComparisonView({ pages }: ComparisonViewProps) {
  const completedPages = pages.filter(p => p.status === 'done');

  if (completedPages.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
        Aucune page traduite à comparer pour le moment.
      </Typography>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {completedPages.map((page) => (
        <Paper key={page.id} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Page {pages.indexOf(page) + 1} - {page.filename}
          </Typography>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <Typography variant="subtitle2" gutterBottom>
                🔍 Original
              </Typography>
              <img
                src={page.originalUrl}
                alt="Original"
                style={{ 
                  width: '100%', 
                  maxHeight: 400, 
                  objectFit: 'contain', 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <Typography variant="subtitle2" gutterBottom>
                ✨ Traduit
              </Typography>
              <img
                src={page.translatedUrl}
                alt="Traduit"
                style={{ 
                  width: '100%', 
                  maxHeight: 400, 
                  objectFit: 'contain', 
                  border: '1px solid #4caf50',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              📊 Statistiques :
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${page.detectedBubbles} bulles détectées`} 
                size="small" 
                color="primary" 
              />
              <Chip 
                label={`${page.processingTime}s de traitement`} 
                size="small" 
                color="secondary" 
              />
              <Chip 
                label={`${page.translatedTexts.length} textes traduits`} 
                size="small" 
                color="success" 
              />
            </Box>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            📝 Textes traduits détectés :
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {page.translatedTexts.length > 0 ? (
              page.translatedTexts.map((text, i) => (
                <Chip 
                  key={i} 
                  label={text} 
                  variant="outlined" 
                  size="small" 
                  sx={{ maxWidth: 200 }}
                />
              ))
            ) : (
              <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                Aucun texte traduit disponible
              </Typography>
            )}
          </Box>
        </Paper>
      ))}
    </div>
  );
}

export default ComparisonView;