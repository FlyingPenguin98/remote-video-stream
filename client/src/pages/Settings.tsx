import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { updateMe } from '../api/auth';
import { Layout } from '../components/Layout';

export function Settings() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    if (newPassword && newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updateMe({
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setStatus('Saved!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.wrap}>
        <h2 style={styles.heading}>Settings</h2>
        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <div style={styles.value}>{user?.username}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <div style={styles.value}>{user?.role}</div>
          </div>
        </div>

        <h3 style={styles.subheading}>Change Password</h3>
        <form onSubmit={handleSave} style={styles.form}>
          {status && <div style={styles.success}>{status}</div>}
          {error && <div style={styles.error}>{error}</div>}
          <input
            style={styles.input}
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="New password (min 8 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 480 },
  heading: { fontSize: 22, fontWeight: 600, marginBottom: 20 },
  card: { background: '#1e1e1e', borderRadius: 8, padding: 20, marginBottom: 32 },
  field: { marginBottom: 12 },
  label: { fontSize: 12, color: '#888', display: 'block', marginBottom: 4 },
  value: { fontSize: 15 },
  subheading: { fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#ccc' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    background: '#1e1e1e', border: '1px solid #333', color: '#fff',
    padding: '10px 14px', borderRadius: 4, fontSize: 14, outline: 'none',
  },
  btn: {
    background: '#e50914', color: '#fff', border: 'none', padding: '11px',
    borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  success: { background: '#1a3a1a', color: '#6fcf6f', padding: '10px 12px', borderRadius: 4, fontSize: 13 },
  error: { background: '#3a1a1a', color: '#ff6b6b', padding: '10px 12px', borderRadius: 4, fontSize: 13 },
};
