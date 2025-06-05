import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
} from '@mui/material';
import { Wifi, WifiOff } from '@mui/icons-material';

function WebSocketManager() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsUrl = 'ws://localhost:8000/ws';

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          console.log('📨 WebSocket message:', event.data);
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);
          
          // Tentative de reconnexion après 5 secondes
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 5000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        return ws;
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
        return null;
      }
    };

    const ws = connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Chip
        icon={isConnected ? <Wifi /> : <WifiOff />}
        label={isConnected ? 'Connecté' : 'Déconnecté'}
        color={isConnected ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
    </Box>
  );
}

export default WebSocketManager;