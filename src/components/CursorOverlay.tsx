import { useCursorTracking } from '../contexts/CursorTrackingContext';
import { useAuth } from '../contexts/AuthContext';
import { useViewport } from '../contexts/ViewportContext';

export function CursorOverlay() {
  const { cursors } = useCursorTracking();
  const { user } = useAuth();
  const { viewport } = useViewport();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      {Array.from(cursors.values()).map((cursor) => {
        // Don't show our own cursor
        if (cursor.userId === user?.id) return null;

        // Convert world coordinates (received from broadcast) to screen coordinates
        // Formula: screenX = worldX * zoom + position.x
        const screenX = cursor.x * viewport.zoom + viewport.position.x;
        const screenY = cursor.y * viewport.zoom + viewport.position.y;

        return (
          <div
            key={cursor.userId}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              transform: 'translate(-2px, -2px)',
              transition: 'left 0.1s ease-out, top 0.1s ease-out'
            }}
          >
            {/* Cursor SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
            >
              <path
                d="M5.65376 12.3673L10.6315 17.3451L10.6861 17.3997L10.7406 17.3451L13.6273 14.4584L13.6818 14.4039L13.7364 14.4584L18.0977 18.8198L18.1523 18.8743L18.2068 18.8198L19.2932 17.7334L19.3477 17.6788L19.2932 17.6243L14.9318 13.263L14.8773 13.2084L14.9318 13.1539L17.8185 10.2672L17.8731 10.2127L17.8185 10.1581L12.8407 5.18036L12.7862 5.12583L12.7316 5.18036L5.07071 12.8413L5.01618 12.8958L5.07071 12.9503L5.65376 13.5334L5.70829 13.5879L5.76282 13.5334L5.65376 12.3673Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Username label */}
            <div
              style={{
                position: 'absolute',
                left: 20,
                top: 0,
                backgroundColor: cursor.color,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {cursor.username}
            </div>
          </div>
        );
      })}
    </div>
  );
}
