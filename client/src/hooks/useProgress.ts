import { useEffect, useRef } from 'react';
import { updateProgress } from '../api/progress';

// positionOffset: for transcoded HLS the server starts the stream at the
// resume offset (ffmpeg -ss), so the <video> timeline begins at 0 and the
// real position is offset + currentTime. Direct play passes 0.
// knownDurationSec: full media duration from the library (ffprobe). The
// element's own duration is wrong for an accumulating HLS playlist.
export function useProgress(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  mediaItemId: number | null,
  episodeId?: number,
  positionOffset = 0,
  knownDurationSec?: number | null
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!mediaItemId) return;

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      const fallbackDuration =
        positionOffset === 0 && Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : undefined;
      updateProgress({
        mediaItemId,
        episodeId,
        positionSec: positionOffset + video.currentTime,
        durationSec: knownDurationSec ?? fallbackDuration,
      }).catch(() => {});
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mediaItemId, episodeId, positionOffset, knownDurationSec]);
}
