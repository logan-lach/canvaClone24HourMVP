import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface CursorPosition {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
  timestamp: number;
}

interface CursorTrackingContextType {
  cursors: Map<string, CursorPosition>;
  broadcastCursor: (x: number, y: number) => void;
}

const CursorTrackingContext = createContext<CursorTrackingContextType | undefined>(undefined);

// Generate consistent color from username (same as PresenceContext)
function generateColor(username: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const THROTTLE_MS = 50; // Send cursor updates every 50ms max
const CURSOR_TIMEOUT_MS = 5000; // Remove cursors that haven't moved in 5 seconds

export function CursorTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const lastBroadcastTime = useRef<number>(0);
  const pendingCursor = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!user) {
      setCursors(new Map());
      if (channel) {
        channel.unsubscribe();
        setChannel(null);
      }
      return;
    }

    // Create channel for cursor broadcasts
    const cursorChannel = supabase.channel('canvas-cursors');

    // Subscribe to cursor broadcast events
    cursorChannel
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        const cursorData = payload as CursorPosition;

        // Don't show our own cursor
        if (cursorData.userId === user.id) return;

        setCursors(prev => {
          const updated = new Map(prev);
          updated.set(cursorData.userId, cursorData);
          return updated;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Cursor tracking channel subscribed');
        }
      });

    setChannel(cursorChannel);

    // Clean up stale cursors periodically
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const updated = new Map(prev);
        let hasChanges = false;

        updated.forEach((cursor, userId) => {
          if (now - cursor.timestamp > CURSOR_TIMEOUT_MS) {
            updated.delete(userId);
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => {
      clearInterval(cleanupInterval);
      cursorChannel.unsubscribe();
    };
  }, [user]);

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channel || !user) return;

    const now = Date.now();

    // Throttle broadcasts
    if (now - lastBroadcastTime.current < THROTTLE_MS) {
      // Store pending cursor update
      pendingCursor.current = { x, y };
      return;
    }

    // Send the broadcast
    const cursorData: CursorPosition = {
      userId: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous',
      color: generateColor(user.user_metadata?.username || user.email || user.id),
      x,
      y,
      timestamp: now
    };

    channel.send({
      type: 'broadcast',
      event: 'cursor-move',
      payload: cursorData
    });

    lastBroadcastTime.current = now;
    pendingCursor.current = null;
  }, [channel, user]);

  // Handle pending cursor updates with a separate interval
  useEffect(() => {
    const sendPendingInterval = setInterval(() => {
      if (pendingCursor.current && channel && user) {
        const { x, y } = pendingCursor.current;
        const now = Date.now();

        if (now - lastBroadcastTime.current >= THROTTLE_MS) {
          const cursorData: CursorPosition = {
            userId: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous',
            color: generateColor(user.user_metadata?.username || user.email || user.id),
            x,
            y,
            timestamp: now
          };

          channel.send({
            type: 'broadcast',
            event: 'cursor-move',
            payload: cursorData
          });

          lastBroadcastTime.current = now;
          pendingCursor.current = null;
        }
      }
    }, THROTTLE_MS);

    return () => clearInterval(sendPendingInterval);
  }, [channel, user]);

  const value = {
    cursors,
    broadcastCursor
  };

  return <CursorTrackingContext.Provider value={value}>{children}</CursorTrackingContext.Provider>;
}

export function useCursorTracking() {
  const context = useContext(CursorTrackingContext);
  if (context === undefined) {
    throw new Error('useCursorTracking must be used within a CursorTrackingProvider');
  }
  return context;
}
