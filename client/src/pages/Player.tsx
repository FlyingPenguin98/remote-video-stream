import { useRef, useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMovie, getShow } from '../api/library';
import { startStream, stopStream, pingStream, buildManifestUrl, buildDirectUrl } from '../api/stream';
import { getProgress, getEpisodeProgress } from '../api/progress';
import { useHls } from '../hooks/useHls';
import { useProgress } from '../hooks/useProgress';

export function Player() {
  const { type, id } = useParams<{ type: 'movie' | 'episode'; id: string }>();
  const [searchParams] = useSearchParams();
  const seriesId = searchParams.get('seriesId');
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const [isDirect, setIsDirect] = useState(false);
  const [resumePos, setResumePos] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs mirror state for the unmount cleanup and ping interval, which would
  // otherwise capture stale values from the mount-time closure.
  const sessionRef = useRef<string | null>(null);
  const isDirectRef = useRef(false);

  const numericId = parseInt(id!, 10);
  const mediaItemId = type === 'movie' ? numericId : (seriesId ? parseInt(seriesId) : null);
  const episodeId = type === 'episode' ? numericId : undefined;

  // Fetch media info for title display and full duration
  const { data: mediaInfo } = useQuery({
    queryKey: ['media-info', type, id, seriesId],
    queryFn: () => type === 'movie' ? getMovie(numericId) : getShow(parseInt(seriesId!)),
    enabled: !!id,
  });

  const currentEpisode = type === 'episode'
    ? (mediaInfo as any)?.seasons
        ?.flatMap((s: any) => s.episodes ?? [])
        ?.find((e: any) => e.id === numericId)
    : null;

  const knownDurationSec: number | null = type === 'movie'
    ? (mediaInfo as any)?.durationSec ?? null
    : currentEpisode?.durationSec ?? null;

  const { mutate: initStream } = useMutation({
    mutationFn: async (startOffset: number) => {
      return startStream({
        ...(type === 'movie' ? { mediaItemId: numericId } : { episodeId: numericId, mediaItemId: mediaItemId ?? undefined }),
        startOffset,
      });
    },
    onSuccess: (data, startOffset) => {
      sessionRef.current = data.sessionId;
      isDirectRef.current = data.isDirect;
      if (data.isDirect) {
        setIsDirect(true);
        const video = videoRef.current;
        if (video) {
          // Direct play streams the raw file; the <video> element seeks itself.
          video.src = buildDirectUrl(numericId, type === 'movie' ? 'movie' : 'episode');
          video.currentTime = startOffset;
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
      // Direct play has no server-side session to tear down.
      if (sessionRef.current && !isDirectRef.current) stopStream(sessionRef.current);
    };
  }, []);

  // Keep-alive: without pings the server reaps the transcode session after
  // SESSION_TIMEOUT and deletes its segments mid-playback.
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionRef.current && !isDirectRef.current) {
        pingStream(sessionRef.current, videoRef.current?.currentTime ?? 0);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useHls(videoRef, !isDirect ? manifestUrl : null);
  useProgress(videoRef, mediaItemId, episodeId, isDirect ? 0 : resumePos, knownDurationSec);

  const title = type === 'movie'
    ? (mediaInfo as any)?.title
    : currentEpisode
      ? `${(mediaInfo as any)?.title} S${String(currentEpisode.seasonNumber).padStart(2, '0')}E${String(currentEpisode.episodeNumber).padStart(2, '0')}`
      : (mediaInfo as any)?.title;

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
