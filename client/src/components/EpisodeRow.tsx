import { Link } from 'react-router-dom';
import type { Episode } from '../../../shared/types';

interface Props {
  episode: Episode;
  seriesId: number;
}

export function EpisodeRow({ episode, seriesId }: Props) {
  const progress = episode.watchProgress;
  const pct = progress?.durationSec
    ? Math.min(100, (progress.positionSec / progress.durationSec) * 100)
    : 0;
  const label = `S${String(episode.seasonNumber).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')}`;

  return (
    <Link to={`/player/episode/${episode.id}?seriesId=${seriesId}`} style={styles.link}>
      <div style={styles.row}>
        {episode.stillUrl ? (
          <img src={episode.stillUrl} alt={episode.title ?? ''} style={styles.still} loading="lazy" />
        ) : (
          <div style={styles.noStill}>{label}</div>
        )}
        <div style={styles.info}>
          <div style={styles.label}>{label} — {episode.title ?? 'Untitled'}</div>
          {episode.overview && <div style={styles.overview}>{episode.overview}</div>}
          {pct > 0 && !progress?.completed && (
            <div style={styles.bar}><div style={{ ...styles.fill, width: `${pct}%` }} /></div>
          )}
        </div>
        {progress?.completed && <span style={styles.check}>✓</span>}
      </div>
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  link: { textDecoration: 'none', color: 'inherit' },
  row: {
    display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #222',
    alignItems: 'flex-start', cursor: 'pointer',
  },
  still: { width: 160, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 4, flexShrink: 0 },
  noStill: {
    width: 160, aspectRatio: '16/9', background: '#2a2a2a', borderRadius: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#666', flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  label: { fontWeight: 500, fontSize: 14, marginBottom: 4 },
  overview: { fontSize: 12, color: '#888', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  bar: { height: 2, background: '#333', borderRadius: 1, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', background: '#e50914' },
  check: { color: '#4caf50', fontSize: 18, alignSelf: 'center' },
};
