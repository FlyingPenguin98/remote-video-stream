import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/auth';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const nav = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      setAuth(data.accessToken, data.user);
      nav('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.logo}>Streamio</h1>
        <p style={styles.sub}>Sign in to your account</p>
        {error && <div style={styles.error}>{error}</div>}
        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#111',
  },
  form: {
    background: '#1e1e1e', padding: 40, borderRadius: 8,
    width: 360, display: 'flex', flexDirection: 'column', gap: 14,
  },
  logo: { color: '#e50914', fontSize: 28, fontWeight: 700, textAlign: 'center' },
  sub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: -8 },
  error: { background: '#3a1a1a', color: '#ff6b6b', padding: '10px 12px', borderRadius: 4, fontSize: 13 },
  input: {
    background: '#2a2a2a', border: '1px solid #333', color: '#fff',
    padding: '10px 14px', borderRadius: 4, fontSize: 14, outline: 'none',
  },
  btn: {
    background: '#e50914', color: '#fff', border: 'none', padding: '12px',
    borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    marginTop: 4,
  },
};
