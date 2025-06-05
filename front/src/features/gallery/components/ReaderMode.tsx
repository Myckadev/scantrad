import {
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

interface PageInfo {
  id: string;
  status: string;
}

interface ReaderModeProps {
  pages: PageInfo[];
  onStartReading: (page: PageInfo, index: number) => void;
}

function ReaderMode({ pages, onStartReading }: ReaderModeProps) {
  const completedPages = pages.filter(p => p.status === 'done');
  
  const startReading = () => {
    if (completedPages.length > 0) {
      const firstPage = completedPages[0];
      const index = pages.indexOf(firstPage);
      onStartReading(firstPage, index);
    }
  };

  return (
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
        onClick={startReading}
        startIcon={<PlayArrow />}
        disabled={completedPages.length === 0}
      >
        {completedPages.length > 0 
          ? `Commencer la lecture (${completedPages.length} pages)` 
          : 'Aucune page traduite'
        }
      </Button>
      
      {completedPages.length > 0 && completedPages.length < pages.length && (
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
          {pages.length - completedPages.length} page(s) encore en traitement
        </Typography>
      )}
    </Paper>
  );
}

export default ReaderMode;