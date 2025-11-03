import { useState } from 'react';
import { usePresence } from '../contexts/PresenceContext';
import { useAuth } from '../contexts/AuthContext';

export default function PresenceIndicators() {
  const { onlineUsers, isConnected } = usePresence();
  const { user } = useAuth();
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  // Debug logging
  console.log('PresenceIndicators - isConnected:', isConnected);
  console.log('PresenceIndicators - onlineUsers:', onlineUsers);
  console.log('PresenceIndicators - current user:', user?.id);

  // Filter out current user and limit display
  const otherUsers = onlineUsers.filter(u => u.id !== user?.id);
  const displayUsers = otherUsers.slice(0, 5);
  const remainingCount = otherUsers.length - displayUsers.length;

  // Show debug info when alone (for testing)
  if (otherUsers.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          zIndex: 1000,
          border: '1px solid #ddd'
        }}
      >
        {isConnected ? '🟢 Connected - Waiting for other users...' : '🔴 Connecting to presence...'}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '8px 16px',
        borderRadius: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e0e0e0'
      }}
    >
      {displayUsers.map((user, index) => {
        const initials = user.username
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const isHovered = hoveredUserId === user.id;

        return (
          <div
            key={user.id}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <div
              onMouseEnter={() => setHoveredUserId(user.id)}
              onMouseLeave={() => setHoveredUserId(null)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: user.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'default',
                marginLeft: index > 0 ? '-8px' : '0',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {initials}
            </div>

            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#333',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  zIndex: 1001,
                  pointerEvents: 'none'
                }}
              >
                {user.username}
              </div>
            )}
          </div>
        );
      })}

      {remainingCount > 0 && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#9e9e9e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '11px',
            fontWeight: '600',
            marginLeft: '-8px',
            border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
