import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'white',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '48px', margin: 0 }}>Canvas Clone</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        Collaborative whiteboard for your team
      </p>

      {user ? (
        <Link
          to="/canvas"
          style={{
            padding: '12px 24px',
            backgroundColor: 'black',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          Go to Canvas
        </Link>
      ) : (
        <Link
          to="/login"
          style={{
            padding: '12px 24px',
            backgroundColor: 'black',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          Login
        </Link>
      )}
    </div>
  );
}
