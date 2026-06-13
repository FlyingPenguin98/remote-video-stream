import { useEffect, useRef } from 'react';
import { updateProgress } from '../api/progress';

export function useProgress(
  videoRef: React.RefObject<HTMLVideoElement>,
  mediaItemId: number | null,
  episodeId?: number
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!mediaItemId) return;

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.duration || video.paused) return;
      updateProgress({
        mediaItemId,
        episodeId,
        positionSec: video.currentTime,
        durationSec: video.duration,
      }).catch(() => {});
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mediaItemId, episodeId]);
}
