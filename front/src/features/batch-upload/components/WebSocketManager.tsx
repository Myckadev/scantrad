import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Chip,
} from '@mui/material';
import { Wifi, WifiOff } from '@mui/icons-material';

function WebSocketManager() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const connectWebSocket = () => {
    // Éviter les connexions multiples
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const wsUrl = 'ws://localhost:8000/ws';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        // Annuler tout timeout de reconnexion en cours
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        console.log('📨 WebSocket message:', event.data);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Reconnexion uniquement si ce n'est pas une fermeture intentionnelle
        if (shouldReconnectRef.current && event.code !== 1000) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              console.log('🔄 Attempting to reconnect WebSocket...');
              connectWebSocket();
            }
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.log('❌ WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    shouldReconnectRef.current = true;
    connectWebSocket();

    return () => {
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
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