import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getShows } from '../api/library';
import { MediaCard } from '../components/MediaCard';
import { Layout } from '../components/Layout';

export function Shows() {
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['shows', q],
    queryFn: () => getShows({ q: q || undefined, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  return (
    <Layout>
      <div style={styles.header}>
        <h2 style={styles.heading}>TV Shows <span style={styles.count}>{data?.total ?? ''}</span></h2>
        <input
          style={styles.search}
          placeholder="Search shows…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {isLoading && <div style={styles.status}>Loading…</div>}
      {!isLoading && !data?.items.length && (
        <div style={styles.status}>No shows found.</div>
      )}
      <div style={styles.grid}>
        {data?.items.map((item) => <MediaCard key={item.id} item={item} />)}
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: 600 },
  count: { fontSize: 14, color: '#666', fontWeight: 400, marginLeft: 6 },
  search: {
    background: '#1e1e1e', border: '1px solid #333', color: '#fff',
    padding: '8px 14px', borderRadius: 4, fontSize: 14, width: 220, outline: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
  },
  status: { color: '#666', padding: '40px 0', textAlign: 'center' },
};
