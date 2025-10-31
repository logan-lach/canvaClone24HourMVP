import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/canvas');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'white'
    }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '300px',
        padding: '32px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: 0, textAlign: 'center' }}>Login</h2>

        {error && (
          <div style={{ padding: '8px', backgroundColor: '#ffe0e0', color: '#c00', borderRadius: '4px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: loading ? '#666' : 'black',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'black', textDecoration: 'underline' }}>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
