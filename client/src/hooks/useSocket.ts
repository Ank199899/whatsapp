import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Initialize socket connection
    const socket = io(process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '', {
      autoConnect: true,
    });

    socketRef.current = socket;

    // Join user room for real-time updates
    socket.emit('join_user_room', user.id);

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  return socketRef.current;
};

export const useSocketEvent = (event: string, handler: (data: any) => void) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
};
