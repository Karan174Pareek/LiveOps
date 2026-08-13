import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Task, UserPresence } from '../types';

interface CursorPosition {
  userId: string;
  fullName: string;
  x: number;
  y: number;
  boardId?: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: UserPresence[];
  cursors: Map<string, CursorPosition>;
  emitTaskMoved: (data: { taskId: string; sourceColumn: string; targetColumn: string; newPosition?: number }) => void;
  emitTaskCreated: (task: Task) => void;
  emitTaskUpdated: (task: Task) => void;
  emitTaskDeleted: (taskId: string) => void;
  emitCursorMove: (x: number, y: number, boardId?: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, activeWorkspace, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());

  useEffect(() => {
    if (!accessToken || !activeWorkspace || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
        workspaceId: activeWorkspace.id
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('[Socket Connected]', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket Disconnected]');
      setConnected(false);
    });

    newSocket.on('presence:update', (users: UserPresence[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('cursor:move', (data: CursorPosition) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, activeWorkspace?.id, user?.id]);

  const emitTaskMoved = (data: { taskId: string; sourceColumn: string; targetColumn: string; newPosition?: number }) => {
    socket?.emit('task:moved', data);
  };

  const emitTaskCreated = (task: Task) => {
    socket?.emit('task:created', { task });
  };

  const emitTaskUpdated = (task: Task) => {
    socket?.emit('task:updated', { task });
  };

  const emitTaskDeleted = (taskId: string) => {
    socket?.emit('task:deleted', { taskId });
  };

  const emitCursorMove = (x: number, y: number, boardId?: string) => {
    socket?.emit('cursor:move', { x, y, boardId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineUsers,
        cursors,
        emitTaskMoved,
        emitTaskCreated,
        emitTaskUpdated,
        emitTaskDeleted,
        emitCursorMove
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
