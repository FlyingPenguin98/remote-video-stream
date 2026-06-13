import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const nav = useNavigate();

  const logout = () => {
    clearAuth();
    nav('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>Streamio</Link>
        <div style={styles.links}>
          <Link to="/movies" style={styles.link}>Movies</Link>
          <Link to="/shows" style={styles.link}>Shows</Link>
        </div>
        <div style={styles.user}>
          <span style={{ color: '#888', fontSize: 13 }}>{user?.username}</span>
          <Link to="/settings" style={{ ...styles.link, marginLeft: 12 }}>Settings</Link>
          <button onClick={logout} style={styles.logout}>Sign out</button>
        </div>
      </nav>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex', alignItems: 'center', padding: '0 24px', height: 56,
    background: '#000', borderBottom: '1px solid #222', gap: 24, flexShrink: 0,
  },
  logo: { color: '#e50914', fontWeight: 700, fontSize: 20, textDecoration: 'none', letterSpacing: -0.5 },
  links: { display: 'flex', gap: 16, flex: 1 },
  link: { color: '#ccc', textDecoration: 'none', fontSize: 14, ':hover': { color: '#fff' } },
  user: { display: 'flex', alignItems: 'center', gap: 8 },
  logout: {
    background: 'none', border: '1px solid #444', color: '#ccc',
    cursor: 'pointer', borderRadius: 4, padding: '4px 10px', fontSize: 13, marginLeft: 4,
  },
  main: { flex: 1, padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' },
};
