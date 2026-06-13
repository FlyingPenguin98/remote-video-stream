import { useRef, useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMovie, getShow } from '../api/library';
import { startStream, stopStream, buildManifestUrl, buildDirectUrl } from '../api/stream';
import { getProgress, getEpisodeProgress } from '../api/progress';
import { useHls } from '../hooks/useHls';
import { useProgress } from '../hooks/useProgress';

export function Player() {
  const { type, id } = useParams<{ type: 'movie' | 'episode'; id: string }>();
  const [searchParams] = useSearchParams();
  const seriesId = searchParams.get('seriesId');
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [isDirect, setIsDirect] = useState(false);
  const [resumePos, setResumePos] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const numericId = parseInt(id!, 10);
  const mediaItemId = type === 'movie' ? numericId : (seriesId ? parseInt(seriesId) : null);
  const episodeId = type === 'episode' ? numericId : undefined;

  // Fetch media info for title display
  const { data: mediaInfo } = useQuery({
    queryKey: ['media-info', type, id, seriesId],
    queryFn: () => type === 'movie' ? getMovie(numericId) : getShow(parseInt(seriesId!)),
    enabled: !!id,
  });

  const { mutate: initStream } = useMutation({
    mutationFn: async (startOffset: number) => {
      return startStream({
        ...(type === 'movie' ? { mediaItemId: numericId } : { episodeId: numericId, mediaItemId: mediaItemId ?? undefined }),
        startOffset,
      });
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      if (data.isDirect && data.fileUrl) {
        setIsDirect(true);
        const video = videoRef.current;
        if (video) {
          video.src = data.fileUrl ?? buildDirectUrl(numericId, type === 'movie' ? 'movie' : 'episode');
          video.currentTime = resumePos;
          video.play().catch(() => {});
        }
      } else {
        setManifestUrl(buildManifestUrl(data.sessionId));
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Failed to start stream');
    },
  });

  useEffect(() => {
    async function init() {
      const progress = type === 'movie'
        ? await getProgress(numericId)
        : mediaItemId ? await getEpisodeProgress(mediaItemId, numericId) : null;
      const pos = (progress && !progress.completed) ? progress.positionSec : 0;
      setResumePos(pos);
      initStream(pos);
    }
    init();
    return () => {
      if (sessionId) stopStream(sessionId);
    };
  }, []);

  useHls(videoRef, !isDirect ? manifestUrl : null, resumePos);
  useProgress(videoRef, mediaItemId, episodeId);

  const title = type === 'movie'
    ? (mediaInfo as any)?.title
    : (() => {
        const ep = (mediaInfo as any)?.seasons
          ?.flatMap((s: any) => s.episodes ?? [])
          ?.find((e: any) => e.id === numericId);
        return ep
          ? `${(mediaInfo as any)?.title} S${String(ep.seasonNumber).padStart(2,'0')}E${String(ep.episodeNumber).padStart(2,'0')}`
          : (mediaInfo as any)?.title;
      })();

  if (error) {
    return (
      <div style={styles.page}>
        <button onClick={() => nav(-1)} style={styles.back}>← Back</button>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button onClick={() => { nav(-1); }} style={styles.back}>← Back</button>
        {title && <span style={styles.titleText}>{title}</span>}
      </div>
      {!manifestUrl && !isDirect && (
        <div style={styles.loading}>Starting stream…</div>
      )}
      <video
        ref={videoRef}
        controls
        style={styles.video}
        playsInline
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topBar: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
    background: 'rgba(0,0,0,0.8)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  back: {
    background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
    fontSize: 14, padding: 0,
  },
  titleText: { color: '#fff', fontSize: 15, fontWeight: 500 },
  video: { width: '100%', flex: 1, maxHeight: '100vh', marginTop: 48 },
  loading: {
    color: '#888', textAlign: 'center', padding: '80px 0', fontSize: 16, position: 'absolute',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
  },
  error: { color: '#ff6b6b', textAlign: 'center', padding: '80px 20px' },
};
