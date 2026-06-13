import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMovies } from '../api/library';
import { MediaCard } from '../components/MediaCard';
import { Layout } from '../components/Layout';

export function Movies() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'title' | 'year' | 'rating'>('title');

  const { data, isLoading } = useQuery({
    queryKey: ['movies', q, sort],
    queryFn: () => getMovies({ q: q || undefined, sort, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  return (
    <Layout>
      <div style={styles.header}>
        <h2 style={styles.heading}>Movies <span style={styles.count}>{data?.total ?? ''}</span></h2>
        <div style={styles.controls}>
          <input
            style={styles.search}
            placeholder="Search movies…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select style={styles.select} value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="title">Title</option>
            <option value="year">Year</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>
      {isLoading && <div style={styles.status}>Loading…</div>}
      {!isLoading && !data?.items.length && (
        <div style={styles.status}>
          No movies found. Add files to your media folder and run a scan.
        </div>
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
  controls: { display: 'flex', gap: 10 },
  search: {
    background: '#1e1e1e', border: '1px solid #333', color: '#fff',
    padding: '8px 14px', borderRadius: 4, fontSize: 14, width: 220, outline: 'none',
  },
  select: {
    background: '#1e1e1e', border: '1px solid #333', color: '#fff',
    padding: '8px 10px', borderRadius: 4, fontSize: 14, cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
  },
  status: { color: '#666', padding: '40px 0', textAlign: 'center' },
};
