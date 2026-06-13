import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getShow } from '../api/library';
import { EpisodeRow } from '../components/EpisodeRow';
import { Layout } from '../components/Layout';

export function ShowDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['show', id],
    queryFn: () => getShow(parseInt(id!, 10)),
    enabled: !!id,
  });
  const [activeSeason, setActiveSeason] = useState<number | null>(null);

  const seasons = data?.seasons ?? [];
  const currentSeason = activeSeason ?? seasons[0]?.seasonNumber ?? null;
  const displaySeason = seasons.find((s: any) => s.seasonNumber === currentSeason);

  if (isLoading) return <Layout><div style={{ color: '#666', padding: 40 }}>Loading…</div></Layout>;
  if (!data) return <Layout><div style={{ color: '#666', padding: 40 }}>Not found.</div></Layout>;

  return (
    <Layout>
      <div style={styles.hero}>
        {data.backdropUrl && (
          <img src={data.backdropUrl} alt={data.title} style={styles.backdrop} />
        )}
        <div style={styles.heroContent}>
          {data.posterUrl && <img src={data.posterUrl} alt={data.title} style={styles.poster} />}
          <div>
            <h1 style={styles.title}>{data.title}</h1>
            <div style={styles.meta}>
              {data.year && <span>{data.year}</span>}
              {data.rating && <span>⭐ {data.rating.toFixed(1)}</span>}
              {data.genres?.length > 0 && <span>{data.genres.join(', ')}</span>}
            </div>
            {data.overview && <p style={styles.overview}>{data.overview}</p>}
          </div>
        </div>
      </div>

      {seasons.length > 1 && (
        <div style={styles.seasonTabs}>
          {seasons.map((s: any) => (
            <button
              key={s.seasonNumber}
              onClick={() => setActiveSeason(s.seasonNumber)}
              style={{
                ...styles.tab,
                ...(s.seasonNumber === currentSeason ? styles.tabActive : {}),
              }}
            >
              Season {s.seasonNumber}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {displaySeason?.episodes?.map((ep: any) => (
          <EpisodeRow key={ep.id} episode={ep} seriesId={data.id} />
        ))}
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: { position: 'relative', marginBottom: 32 },
  backdrop: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover', opacity: 0.2, borderRadius: 8,
  },
  heroContent: {
    position: 'relative', display: 'flex', gap: 24, padding: 24,
    background: 'linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.4))',
    borderRadius: 8, minHeight: 200,
  },
  poster: { width: 120, borderRadius: 6, flexShrink: 0, alignSelf: 'flex-start' },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 8 },
  meta: { display: 'flex', gap: 16, color: '#888', fontSize: 13, marginBottom: 12 },
  overview: { color: '#bbb', fontSize: 14, lineHeight: 1.6, maxWidth: 600 },
  seasonTabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tab: {
    background: '#1e1e1e', border: '1px solid #333', color: '#ccc',
    padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
  },
  tabActive: { background: '#e50914', border: '1px solid #e50914', color: '#fff' },
};
