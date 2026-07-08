import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socketInstance = null;

/**
 * Returns a singleton socket connection.
 * Call connect() once (e.g., in App or ChatPage).
 */
export function useSocket() {
  const socketRef = useRef(null);

  const getSocket = useCallback(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, { transports: ['websocket'], autoConnect: false });
    }
    return socketInstance;
  }, []);

  useEffect(() => {
    return () => {
      // Don't destroy singleton on unmount — reused across pages
    };
  }, []);

  return getSocket;
}
