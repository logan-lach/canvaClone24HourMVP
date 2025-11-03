import Canvas from '../components/Canvas';
import PresenceIndicators from '../components/PresenceIndicators';
import { CursorOverlay } from '../components/CursorOverlay';
import { useAuth } from '../contexts/AuthContext';
import { PresenceProvider } from '../contexts/PresenceContext';
import { CanvasSyncProvider } from '../contexts/CanvasSyncContext';
import { CursorTrackingProvider } from '../contexts/CursorTrackingContext';
import { ShapeLockProvider } from '../contexts/ShapeLockContext';
import { ViewportProvider } from '../contexts/ViewportContext';
import { useNavigate } from 'react-router-dom';

export default function CanvasPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <PresenceProvider>
      <CanvasSyncProvider>
        <CursorTrackingProvider>
          <ShapeLockProvider>
            <ViewportProvider>
              <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
                <PresenceIndicators />
                <button
                  onClick={handleLogout}
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    color: 'black',
                    border: '1px solid black',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    zIndex: 1000
                  }}
                >
                  Logout
                </button>
                <Canvas />
                <CursorOverlay />
              </div>
            </ViewportProvider>
          </ShapeLockProvider>
        </CursorTrackingProvider>
      </CanvasSyncProvider>
    </PresenceProvider>
  );
}
