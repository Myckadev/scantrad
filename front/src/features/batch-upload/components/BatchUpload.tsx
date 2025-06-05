import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  TextField,
} from '@mui/material';
import {
  CloudUpload,
  Delete as DeleteIcon,
  PlayArrow,
  Login,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { 
  useUploadBatchMutation, 
  useGetUserBatchesQuery,
  useLoginMutation,
  getCurrentUser,
} from '../../../app/services/api';
import FileCard from './FileCard';
import RecentBatches from './RecentBatches';
import WebSocketManager from './WebSocketManager';

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

function BatchUpload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [userPseudo, setUserPseudo] = useState(getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState(!!getCurrentUser());
  
  const [login, { isLoading: isLoggingIn, error: loginError }] = useLoginMutation();
  const [uploadBatch, { isLoading: isUploading, error: uploadError }] = useUploadBatchMutation();
  
  const { 
    data: userBatchesResponse, 
    refetch: refetchBatches,
    isLoading: isLoadingBatches 
  } = useGetUserBatchesQuery(userPseudo || '', {
    skip: !isLoggedIn || !userPseudo,
  });

  const userBatches = userBatchesResponse?.batches || [];

  const handleLogin = async () => {
    if (!userPseudo || userPseudo.trim().length < 2) {
      return;
    }
    
    try {
      await login(userPseudo.trim()).unwrap();
      setIsLoggedIn(true);
      // Pas besoin de refetch, la query va se déclencher automatiquement
      // car skip va devenir false
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    multiple: true,
    disabled: !isLoggedIn
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const startProcessing = async () => {
    if (files.length === 0 || !isLoggedIn) return;

    try {
      // Convertir chaque fichier en base64
      const pages = await Promise.all(
        files.map(async (fileData) => {
          return new Promise<{ filename: string; image_base64: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              // Enlever le préfixe "data:image/...;base64," pour garder seulement la partie base64
              const base64Data = base64.split(',')[1];
              resolve({
                filename: fileData.file.name,
                image_base64: base64Data
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(fileData.file);
          });
        })
      );

      // Envoyer les données au format JSON attendu par le backend
      const result = await uploadBatch({ pages }).unwrap();
      
      // Nettoyer les fichiers locaux
      clearFiles();
      
      // Rediriger vers la galerie du nouveau batch
      navigate(`/gallery/${result.batchId}`);
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    }
  };

  const clearFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  // Nettoyer les URLs d'objets au démontage
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Si pas connecté, afficher le formulaire de login
  if (!isLoggedIn) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            🗾 Connexion ScanTrad
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Entrez votre pseudo pour commencer à traduire vos mangas
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Votre pseudo"
              value={userPseudo}
              onChange={(e) => setUserPseudo(e.target.value)}
              variant="outlined"
              disabled={isLoggingIn}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              helperText="Minimum 2 caractères"
            />
            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={isLoggingIn || !userPseudo || userPseudo.trim().length < 2}
              startIcon={<Login />}
              sx={{ minWidth: 120 }}
            >
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>
          
          {loginError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Erreur de connexion: {loginError.toString()}
            </Alert>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* WebSocket Manager pour les updates temps réel */}
      <WebSocketManager />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          📤 Upload de Manga
        </Typography>
        <Typography variant="subtitle1" color="primary">
          Connecté en tant que: <strong>{userPseudo}</strong>
        </Typography>
      </Box>
      
      {/* Zone de drag & drop */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          border: isDragActive ? '3px solid #1976d2' : '2px dashed #ddd',
          backgroundColor: isDragActive ? '#f3f8ff' : 'transparent',
          cursor: isLoggedIn ? 'pointer' : 'not-allowed',
          mb: 3,
          transition: 'all 0.3s ease',
          opacity: isLoggedIn ? 1 : 0.6,
          '&:hover': isLoggedIn ? {
            backgroundColor: '#f8f9fa',
            borderColor: '#1976d2'
          } : {}
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

      {/* Erreurs */}
      {uploadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors de l'upload: {uploadError.toString()}
        </Alert>
      )}

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
                disabled={isUploading}
                startIcon={<PlayArrow />}
                size="large"
              >
                {isUploading ? 'Upload en cours...' : 'Démarrer le traitement'}
              </Button>
              <Button
                variant="outlined"
                onClick={clearFiles}
                disabled={isUploading}
                startIcon={<DeleteIcon />}
              >
                Vider
              </Button>
            </Box>
          </Box>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {files.map((fileData) => (
              <FileCard
                key={fileData.id}
                fileData={fileData}
                onRemove={removeFile}
                disabled={isUploading}
              />
            ))}
          </div>
        </Paper>
      )}

      {/* Indicateur de traitement */}
      {isUploading && (
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3f8ff', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🚀 Upload vers le serveur...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Vos images sont en cours d'envoi. Le traitement IA commencera automatiquement.
          </Typography>
        </Paper>
      )}

      {/* Historique des batches */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          📚 Chapitres récents
        </Typography>
        {isLoadingBatches ? (
          <Typography variant="body2" color="textSecondary">
            Chargement des batches...
          </Typography>
        ) : (
          <RecentBatches 
            batches={userBatches} 
          />
        )}
      </Paper>
    </Box>
  );
}

export default BatchUpload;