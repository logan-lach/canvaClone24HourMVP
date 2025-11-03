import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface PresenceUser {
  id: string;
  username: string;
  color: string;
}

interface PresenceContextType {
  onlineUsers: PresenceUser[];
  isConnected: boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

// Generate consistent color from username
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

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      // Clear presence when logged out
      setOnlineUsers([]);
      setIsConnected(false);
      if (channel) {
        channel.unsubscribe();
        setChannel(null);
      }
      return;
    }

    // Create channel with presence configuration
    console.log('Creating presence channel for user:', user.id);
    const presenceChannel = supabase.channel('canvas-presence');

    // Prepare current user data
    const currentUser: PresenceUser = {
      id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous',
      color: generateColor(user.user_metadata?.username || user.email || user.id)
    };

    // Subscribe to presence events
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        // Get all present users from the channel state
        const presenceState = presenceChannel.presenceState();
        console.log('Presence sync - full state:', presenceState);

        // Extract users from presence state
        const users: PresenceUser[] = [];
        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user) {
              users.push(presence.user);
            }
          });
        });

        console.log('Setting online users:', users);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        // Sync event will handle the state update
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        // Sync event will handle the state update
      })
      .subscribe(async (status) => {
        console.log('Channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);

          // Track our presence
          console.log('Tracking presence for user:', currentUser);
          const trackStatus = await presenceChannel.track({ user: currentUser });
          console.log('Track status:', trackStatus);
        }
      });

    setChannel(presenceChannel);

    return () => {
      console.log('Cleaning up presence channel');
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
    };
  }, [user]);

  const value = {
    onlineUsers,
    isConnected
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
