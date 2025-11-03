import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface ShapeLock {
  userId: string;
  username: string;
  color: string;
}

interface ShapeLockContextType {
  lockedShapes: Map<string, ShapeLock>;
  lockShape: (shapeId: string) => boolean;
  unlockShape: (shapeId: string) => void;
  isLocked: (shapeId: string) => boolean;
  getShapeLock: (shapeId: string) => ShapeLock | undefined;
}

const ShapeLockContext = createContext<ShapeLockContextType | undefined>(undefined);

// Generate consistent color from username (same as other contexts)
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

export function ShapeLockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lockedShapes, setLockedShapes] = useState<Map<string, ShapeLock>>(new Map());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      setLockedShapes(new Map());
      if (channel) {
        channel.unsubscribe();
        setChannel(null);
      }
      return;
    }

    // Create channel for shape lock broadcasts
    const lockChannel = supabase.channel('shape-locks');

    // Subscribe to lock/unlock events
    lockChannel
      .on('broadcast', { event: 'lock' }, ({ payload }) => {
        const { shapeId, userId, username, color } = payload as {
          shapeId: string;
          userId: string;
          username: string;
          color: string;
        };

        setLockedShapes(prev => {
          const updated = new Map(prev);
          updated.set(shapeId, { userId, username, color });
          return updated;
        });
      })
      .on('broadcast', { event: 'unlock' }, ({ payload }) => {
        const { shapeId, userId } = payload as { shapeId: string; userId: string };

        setLockedShapes(prev => {
          const updated = new Map(prev);
          const lock = updated.get(shapeId);

          // Only unlock if the user unlocking is the one who locked it
          if (lock && lock.userId === userId) {
            updated.delete(shapeId);
            return updated;
          }

          return prev;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Shape lock channel subscribed');
        }
      });

    setChannel(lockChannel);

    return () => {
      // Unlock all shapes locked by this user when disconnecting
      lockedShapes.forEach((lock, shapeId) => {
        if (lock.userId === user.id) {
          lockChannel.send({
            type: 'broadcast',
            event: 'unlock',
            payload: { shapeId, userId: user.id }
          });
        }
      });

      lockChannel.unsubscribe();
    };
  }, [user]);

  const lockShape = useCallback((shapeId: string): boolean => {
    if (!channel || !user) {
      // Gracefully degrade - allow drag if not connected yet
      console.log('Lock channel not ready, allowing drag');
      return true;
    }

    let canLock = true;

    // Use functional update to check existing lock without stale closure
    setLockedShapes(prev => {
      const existingLock = prev.get(shapeId);

      if (existingLock) {
        // If locked by current user, allow (re-lock)
        if (existingLock.userId === user.id) {
          canLock = true;
          return prev;
        }
        // Locked by someone else - prevent lock
        canLock = false;
        return prev;
      }

      // Broadcast lock
      const lockData = {
        shapeId,
        userId: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous',
        color: generateColor(user.user_metadata?.username || user.email || user.id)
      };

      channel.send({
        type: 'broadcast',
        event: 'lock',
        payload: lockData
      });

      // Add lock to state
      const updated = new Map(prev);
      updated.set(shapeId, {
        userId: lockData.userId,
        username: lockData.username,
        color: lockData.color
      });
      return updated;
    });

    return canLock;
  }, [channel, user]);

  const unlockShape = useCallback((shapeId: string) => {
    if (!channel || !user) return;

    // Use functional update to avoid stale closure
    setLockedShapes(prev => {
      const lock = prev.get(shapeId);

      // Only unlock if we own the lock
      if (lock && lock.userId === user.id) {
        channel.send({
          type: 'broadcast',
          event: 'unlock',
          payload: { shapeId, userId: user.id }
        });

        const updated = new Map(prev);
        updated.delete(shapeId);
        return updated;
      }

      return prev;
    });
  }, [channel, user]);

  const isLocked = useCallback((shapeId: string): boolean => {
    return lockedShapes.has(shapeId);
  }, [lockedShapes]);

  const getShapeLock = useCallback((shapeId: string): ShapeLock | undefined => {
    return lockedShapes.get(shapeId);
  }, [lockedShapes]);

  const value = {
    lockedShapes,
    lockShape,
    unlockShape,
    isLocked,
    getShapeLock
  };

  return <ShapeLockContext.Provider value={value}>{children}</ShapeLockContext.Provider>;
}

export function useShapeLock() {
  const context = useContext(ShapeLockContext);
  if (context === undefined) {
    throw new Error('useShapeLock must be used within a ShapeLockProvider');
  }
  return context;
}
