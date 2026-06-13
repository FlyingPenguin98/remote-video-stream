import { Link } from 'react-router-dom';
import type { MediaItem } from '../../../shared/types';

interface Props {
  item: MediaItem;
}

export function MediaCard({ item }: Props) {
  const href = item.type === 'movie' ? `/player/movie/${item.id}` : `/shows/${item.id}`;
  const progress = item.watchProgress;
  const pct = progress?.durationSec
    ? Math.min(100, (progress.positionSec / progress.durationSec) * 100)
    : 0;

  return (
    <Link to={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={styles.card}>
        {item.posterUrl ? (
          <img src={item.posterUrl} alt={item.title} style={styles.poster} loading="lazy" />
        ) : (
          <div style={styles.noPoster}>{item.title[0]}</div>
        )}
        {pct > 0 && !progress?.completed && (
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${pct}%` }} />
          </div>
        )}
        <div style={styles.info}>
          <div style={styles.title}>{item.title}</div>
          {item.year && <div style={styles.year}>{item.year}</div>}
        </div>
      </div>
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 6,
    overflow: 'hidden',
    background: '#1e1e1e',
    cursor: 'pointer',
    transition: 'transform 0.15s',
    position: 'relative',
  },
  poster: { width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' },
  noPoster: {
    width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 48, background: '#2a2a2a', color: '#666',
  },
  progressBar: {
    position: 'absolute', bottom: 44, left: 0, right: 0,
    height: 3, background: 'rgba(255,255,255,0.2)',
  },
  progressFill: { height: '100%', background: '#e50914', transition: 'width 0.3s' },
  info: { padding: '8px 10px 10px' },
  title: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  year: { fontSize: 12, color: '#888', marginTop: 2 },
};
