import {
  Paper,
  Typography,
  Button,
} from '@mui/material';
import { Download } from '@mui/icons-material';

interface BatchInfo {
  id: string;
  totalPages: number;
  completedPages: number;
  status: string;
}

interface PageInfo {
  id: string;
  filename: string;
  status: string;
  detectedBubbles: number;
  processingTime: number;
}

interface GalleryStatsProps {
  batch: BatchInfo;
  pages: PageInfo[];
}

function GalleryStats({ batch, pages }: GalleryStatsProps) {
  const completedPages = pages.filter(p => p.status === 'done').length;
  const totalBubbles = pages.reduce((sum, p) => sum + p.detectedBubbles, 0);
  const avgProcessingTime = pages.length > 0 
    ? pages.reduce((sum, p) => sum + p.processingTime, 0) / pages.length 
    : 0;

  const downloadAll = () => {
    console.log('Téléchargement de toutes les pages...');
    alert('Fonctionnalité de téléchargement en cours de développement');
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '16px',
      marginBottom: '24px'
    }}>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="primary">
          {completedPages}/{batch.totalPages}
        </Typography>
        <Typography variant="caption">Pages traduites</Typography>
      </Paper>
      
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="secondary">
          {totalBubbles}
        </Typography>
        <Typography variant="caption">Bulles estimées</Typography>
      </Paper>
      
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="success.main">
          {avgProcessingTime > 0 ? avgProcessingTime.toFixed(1) : 0}s
        </Typography>
        <Typography variant="caption">Temps moyen</Typography>
      </Paper>
      
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
    </div>
  );
}

export default GalleryStats;