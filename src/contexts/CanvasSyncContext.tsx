import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Shape = {
  id: string;
  type: 'rect' | 'circle' | 'text';
  x: number;
  y: number;
  fill: string;
  userId?: string;
  dbId?: string;
};

interface CanvasSyncContextType {
  shapes: Shape[];
  addShape: (type: 'rect' | 'circle' | 'text', x: number, y: number) => Promise<void>;
  updateShape: (id: string, x: number, y: number) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  broadcastShapePosition: (shapeId: string, x: number, y: number) => void;
  setLocallyDraggingShape: (shapeId: string | null) => void;
  isLoading: boolean;
}

const CanvasSyncContext = createContext<CanvasSyncContextType | undefined>(undefined);

const THROTTLE_MS = 50; // Throttle drag broadcasts to 50ms (same as cursor tracking)

export function CanvasSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragChannel, setDragChannel] = useState<RealtimeChannel | null>(null);
  const lastBroadcastTime = useRef<number>(0);
  const pendingBroadcast = useRef<{ shapeId: string; x: number; y: number } | null>(null);
  const locallyDraggingShape = useRef<string | null>(null);

  // Fetch initial shapes from database
  useEffect(() => {
    const fetchShapes = async () => {
      try {
        console.log('Fetching initial shapes from database...');
        const { data, error } = await supabase
          .from('ShapesActive')
          .select('*');

        if (error) {
          console.error('Error fetching shapes:', error);
          return;
        }

        console.log('Fetched shapes:', data);

        // Parse shape_info JSON from each row
        const parsedShapes = data.map((row: any) => ({
          dbId: row.id,
          ...row.shape_info
        }));

        setShapes(parsedShapes);
      } catch (error) {
        console.error('Error in fetchShapes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShapes();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    console.log('Setting up realtime subscription for ShapesActive...');

    const realtimeChannel = supabase
      .channel('shapesactive-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ShapesActive'
        },
        (payload) => {
          console.log('Shape inserted:', payload);
          const newShape = {
            dbId: payload.new.id,
            ...payload.new.shape_info
          };

          // Check if shape already exists (from optimistic update)
          setShapes(prev => {
            const existingIndex = prev.findIndex(s => s.id === newShape.id);

            if (existingIndex !== -1) {
              // Update existing shape with dbId
              console.log('Updating optimistic shape with dbId:', newShape.id);
              const updated = [...prev];
              updated[existingIndex] = { ...updated[existingIndex], dbId: newShape.dbId };
              return updated;
            } else {
              // Add new shape (from another user)
              console.log('Adding new shape from another user:', newShape.id);
              return [...prev, newShape];
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ShapesActive'
        },
        (payload) => {
          console.log('Shape updated:', payload);
          const updatedShape = {
            dbId: payload.new.id,
            ...payload.new.shape_info
          };
          setShapes(prev =>
            prev.map(shape =>
              shape.dbId === updatedShape.dbId ? updatedShape : shape
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ShapesActive'
        },
        (payload) => {
          console.log('Shape deleted:', payload);
          setShapes(prev => prev.filter(shape => shape.dbId !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      realtimeChannel.unsubscribe();
    };
  }, []);

  // Subscribe to drag position broadcasts
  useEffect(() => {
    if (!user) {
      if (dragChannel) {
        dragChannel.unsubscribe();
        setDragChannel(null);
      }
      return;
    }

    console.log('Setting up drag broadcast channel...');
    const channel = supabase.channel('shape-drag-positions');

    channel
      .on('broadcast', { event: 'drag-move' }, ({ payload }) => {
        const { shapeId, x, y, userId: dragUserId } = payload as {
          shapeId: string;
          x: number;
          y: number;
          userId: string;
        };

        // Don't apply our own broadcasts
        if (dragUserId === user.id) return;

        // Don't update shapes we're currently dragging locally
        if (locallyDraggingShape.current === shapeId) return;

        // Update shape position in real-time
        setShapes(prev =>
          prev.map(shape =>
            shape.id === shapeId ? { ...shape, x, y } : shape
          )
        );
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Drag broadcast channel subscribed');
        }
      });

    setDragChannel(channel);

    return () => {
      console.log('Cleaning up drag broadcast channel');
      channel.unsubscribe();
    };
  }, [user]);

  // Broadcast shape position during drag (throttled)
  const broadcastShapePosition = useCallback((shapeId: string, x: number, y: number) => {
    if (!dragChannel || !user) return;

    const now = Date.now();

    // Throttle broadcasts
    if (now - lastBroadcastTime.current < THROTTLE_MS) {
      // Store pending broadcast
      pendingBroadcast.current = { shapeId, x, y };
      return;
    }

    // Send the broadcast
    dragChannel.send({
      type: 'broadcast',
      event: 'drag-move',
      payload: {
        shapeId,
        x,
        y,
        userId: user.id
      }
    });

    lastBroadcastTime.current = now;
    pendingBroadcast.current = null;
  }, [dragChannel, user]);

  // Handle pending broadcasts with interval
  useEffect(() => {
    const sendPendingInterval = setInterval(() => {
      if (pendingBroadcast.current && dragChannel && user) {
        const { shapeId, x, y } = pendingBroadcast.current;
        const now = Date.now();

        if (now - lastBroadcastTime.current >= THROTTLE_MS) {
          dragChannel.send({
            type: 'broadcast',
            event: 'drag-move',
            payload: {
              shapeId,
              x,
              y,
              userId: user.id
            }
          });

          lastBroadcastTime.current = now;
          pendingBroadcast.current = null;
        }
      }
    }, THROTTLE_MS);

    return () => clearInterval(sendPendingInterval);
  }, [dragChannel, user]);

  const addShape = useCallback(async (type: 'rect' | 'circle' | 'text', x: number, y: number) => {
    const newShape: Shape = {
      id: `shape-${Date.now()}-${Math.random()}`,
      type,
      x,
      y,
      fill: type === 'rect'
        ? 'rgba(0, 100, 255, 0.5)'
        : type === 'circle'
        ? 'rgba(0, 255, 100, 0.5)'
        : 'black',
      userId: user?.id
    };

    // Optimistic update
    setShapes(prev => [...prev, newShape]);

    try {
      console.log('Inserting shape to database:', newShape);
      const { error } = await supabase
        .from('ShapesActive')
        .insert({
          shape_info: newShape
        });

      if (error) {
        console.error('Error inserting shape:', error);
        // Rollback optimistic update
        setShapes(prev => prev.filter(s => s.id !== newShape.id));
      }
    } catch (error) {
      console.error('Error in addShape:', error);
      // Rollback optimistic update
      setShapes(prev => prev.filter(s => s.id !== newShape.id));
    }
  }, [user]);

  const updateShape = useCallback(async (id: string, x: number, y: number) => {
    // Find the shape and its dbId
    const shape = shapes.find(s => s.id === id);
    if (!shape || !shape.dbId) {
      console.error('Shape not found or missing dbId:', id);
      return;
    }

    // Optimistic update
    setShapes(prev =>
      prev.map(s => (s.id === id ? { ...s, x, y } : s))
    );

    try {
      console.log('Updating shape position:', { id, x, y });
      const updatedShapeInfo = { ...shape, x, y };
      delete updatedShapeInfo.dbId; // Remove dbId from shape_info

      const { error } = await supabase
        .from('ShapesActive')
        .update({
          shape_info: updatedShapeInfo
        })
        .eq('id', shape.dbId);

      if (error) {
        console.error('Error updating shape:', error);
        // Rollback optimistic update
        setShapes(prev =>
          prev.map(s => (s.id === id ? shape : s))
        );
      }
    } catch (error) {
      console.error('Error in updateShape:', error);
      // Rollback optimistic update
      setShapes(prev =>
        prev.map(s => (s.id === id ? shape : s))
      );
    }
  }, [shapes]);

  const deleteShape = useCallback(async (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || !shape.dbId) {
      console.error('Shape not found or missing dbId:', id);
      return;
    }

    // Optimistic update
    setShapes(prev => prev.filter(s => s.id !== id));

    try {
      console.log('Deleting shape:', id);
      const { error } = await supabase
        .from('ShapesActive')
        .delete()
        .eq('id', shape.dbId);

      if (error) {
        console.error('Error deleting shape:', error);
        // Rollback optimistic update
        setShapes(prev => [...prev, shape]);
      }
    } catch (error) {
      console.error('Error in deleteShape:', error);
      // Rollback optimistic update
      setShapes(prev => [...prev, shape]);
    }
  }, [shapes]);

  const setLocallyDraggingShape = useCallback((shapeId: string | null) => {
    locallyDraggingShape.current = shapeId;
  }, []);

  const value = {
    shapes,
    addShape,
    updateShape,
    deleteShape,
    broadcastShapePosition,
    setLocallyDraggingShape,
    isLoading
  };

  return <CanvasSyncContext.Provider value={value}>{children}</CanvasSyncContext.Provider>;
}

export function useCanvasSync() {
  const context = useContext(CanvasSyncContext);
  if (context === undefined) {
    throw new Error('useCanvasSync must be used within a CanvasSyncProvider');
  }
  return context;
}
