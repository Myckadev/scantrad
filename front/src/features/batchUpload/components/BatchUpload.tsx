import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import {
  CloudUpload,
  Image as ImageIcon,
  CheckCircle,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  PlayArrow,
  Visibility,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  preview?: string;
  progress?: number;
}

function BatchUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const startProcessing = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const newBatchId = `batch_${Date.now()}`;
    setBatchId(newBatchId);
    
    // Simuler le traitement
    for (let i = 0; i < files.length; i++) {
      const fileId = files[i].id;
      
      // Marquer comme en cours de traitement
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', progress: 0 }
          : f
      ));

      // Simulation de progression
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress }
            : f
        ));
      }

      // Marquer comme terminé
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'done', progress: 100 }
          : f
      ));
    }

    setIsProcessing(false);
  };

  const clearFiles = () => {
    setFiles([]);
    setBatchId(null);
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'done': return <CheckCircle color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'processing': return <PlayArrow color="primary" />;
      default: return <ImageIcon />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'done': return 'success';
      case 'error': return 'error';
      case 'processing': return 'primary';
      default: return 'default';
    }
  };

  const allProcessed = files.length > 0 && files.every(f => f.status === 'done');

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        📤 Upload de Manga
      </Typography>
      
      {/* Zone de drag & drop */}
      <Paper 
        {...getRootProps()} 
        sx={{ 
          p: 4, 
          textAlign: 'center', 
          border: isDragActive ? '3px solid #1976d2' : '2px dashed #ddd',
          backgroundColor: isDragActive ? '#f3f8ff' : 'transparent',
          cursor: 'pointer',
          mb: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#f8f9fa',
            borderColor: '#1976d2'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive 
            ? "📥 Déposez vos fichiers ici..." 
            : "🖼️ Glissez-déposez vos images ou cliquez pour sélectionner"
          }
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Formats acceptés: PNG, JPG, JPEG, WEBP, GIF • Plusieurs fichiers supportés
        </Typography>
      </Paper>

      {/* Galerie des fichiers */}
      {files.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              📁 Fichiers sélectionnés ({files.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={startProcessing}
                disabled={isProcessing || allProcessed}
                startIcon={<PlayArrow />}
                size="large"
              >
                {isProcessing ? 'Traitement en cours...' : allProcessed ? 'Traitement terminé' : 'Démarrer le traitement'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={clearFiles}
                disabled={isProcessing}
                startIcon={<DeleteIcon />}
              >
                Vider
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {files.map((fileData) => (
              <Grid item xs={12} sm={6} md={4} key={fileData.id}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Chip 
                        label={fileData.status}
                        color={getStatusColor(fileData.status) as any}
                        size="small"
                        icon={getStatusIcon(fileData.status)}
                      />
                      {!isProcessing && (
                        <IconButton size="small" onClick={() => removeFile(fileData.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    {fileData.status === 'processing' && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={fileData.progress || 0} 
                          sx={{ borderRadius: 1 }}
                        />
                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                          {fileData.progress || 0}% - Détection + OCR + Traduction...
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Résultats */}
      {batchId && allProcessed && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" startIcon={<Visibility />}>
              Voir la galerie
            </Button>
          }
        >
          🎉 <strong>Traitement terminé !</strong>
          <br />
          Batch ID: <code>{batchId}</code>
          <br />
          {files.length} page(s) de manga traduites avec succès !
        </Alert>
      )}

      {/* Indicateur de traitement global */}
      {isProcessing && (
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3f8ff' }}>
          <Typography variant="h6" gutterBottom>
            🤖 Traitement IA en cours...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            1. Détection des bulles de texte (YOLO) → 2. Reconnaissance de texte (OCR) → 3. Traduction (Transformer)
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default BatchUpload;