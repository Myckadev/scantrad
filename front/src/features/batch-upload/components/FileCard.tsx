import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { JSX } from 'react';

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

interface FileCardProps {
  fileData: UploadedFile;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

function FileCard({ fileData, onRemove, disabled = false }: FileCardProps): JSX.Element {
  return (
    <Card sx={{ position: 'relative' }}>
      {fileData.preview && (
        <CardMedia
          component="img"
          height="200"
          image={fileData.preview}
          alt={fileData.file.name}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle2" noWrap title={fileData.file.name}>
          {fileData.file.name}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          {!disabled && (
            <IconButton size="small" onClick={() => onRemove(fileData.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default FileCard;