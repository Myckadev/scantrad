import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  PlayArrow,
  Visibility,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface Batch {
  _id: string;
  status: string;
  pages: Array<{ status: string }>;
  created_at: string;
}

interface RecentBatchesProps {
  batches: Batch[];
}

function RecentBatches({ batches }: RecentBatchesProps) {
  if (batches.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
        Aucun chapitre traité pour le moment. Uploadez vos premières images !
      </Typography>
    );
  }

  return (
    <List>
      {batches.slice(0, 5).map((batch) => {
        const isCompleted = batch.status === 'done';
        const completedPages = batch.pages?.filter(p => p.status === 'done').length || 0;
        const totalPages = batch.pages?.length || 0;
        
        return (
          <ListItem
            key={batch._id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <ListItemIcon>
              {isCompleted ? (
                <CheckCircle color="success" />
              ) : (
                <PlayArrow color="primary" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    Batch {batch._id.slice(-8)}
                  </Typography>
                  <Chip
                    label={`${completedPages}/${totalPages}`}
                    size="small"
                    color={isCompleted ? 'success' : 'primary'}
                  />
                  <Chip
                    label={batch.status}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Typography variant="caption" color="textSecondary">
                  Créé le {new Date(batch.created_at).toLocaleString('fr-FR')}
                </Typography>
              }
            />
            <Button
              component={Link}
              to={`/gallery/${batch._id}`}
              size="small"
              startIcon={<Visibility />}
              variant={isCompleted ? 'contained' : 'outlined'}
            >
              Voir
            </Button>
          </ListItem>
        );
      })}
    </List>
  );
}

export default RecentBatches;