import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getContinueWatching, getRecentlyAdded } from '../api/library';
import { MediaCard } from '../components/MediaCard';
import { Layout } from '../components/Layout';

export function Home() {
  const { data: continueWatching } = useQuery({
    queryKey: ['continue-watching'],
    queryFn: getContinueWatching,
  });
  const { data: recent } = useQuery({
    queryKey: ['recently-added'],
    queryFn: () => getRecentlyAdded(20),
  });

  return (
    <Layout>
      {continueWatching && continueWatching.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Continue Watching</h2>
          <div style={styles.row}>
            {continueWatching.map((item: any) => (
              <div key={`${item.mediaItem.id}-${item.episode?.id ?? 'movie'}`} style={styles.rowItem}>
                <MediaCard item={{ ...item.mediaItem, watchProgress: { positionSec: item.positionSec, durationSec: item.durationSec, completed: false } as any }} />
              </div>
            ))}
          </div>
        </section>
      )}
      {recent && recent.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recently Added</h2>
            <Link to="/movies" style={styles.seeAll}>See all →</Link>
          </div>
          <div style={styles.row}>
            {recent.map((item: any) => (
              <div key={item.id} style={styles.rowItem}>
                <MediaCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}
      {(!continueWatching?.length && !recent?.length) && (
        <div style={styles.empty}>
          <p>Your library is empty.</p>
          <p style={{ color: '#666', marginTop: 8, fontSize: 14 }}>
            Add media files to your configured MEDIA_ROOT and trigger a scan.
          </p>
        </div>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: 40 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 600 },
  seeAll: { color: '#888', fontSize: 13, textDecoration: 'none' },
  row: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 },
  rowItem: { flexShrink: 0, width: 150 },
  empty: { textAlign: 'center', padding: '80px 0', color: '#aaa' },
};
