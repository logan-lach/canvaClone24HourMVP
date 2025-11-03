import Canvas from '../components/Canvas';
import PresenceIndicators from '../components/PresenceIndicators';
import { useAuth } from '../contexts/AuthContext';
import { PresenceProvider } from '../contexts/PresenceContext';
import { CanvasSyncProvider } from '../contexts/CanvasSyncContext';
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
        </div>
      </CanvasSyncProvider>
    </PresenceProvider>
  );
}
