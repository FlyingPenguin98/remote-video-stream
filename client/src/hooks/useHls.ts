import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function useHls(
  videoRef: React.RefObject<HTMLVideoElement>,
  src: string | null,
  startPosition = 0
) {
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!src || !video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        startPosition,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      if (startPosition > 0) video.currentTime = startPosition;
      video.play().catch(() => {});
    }
  }, [src]);
}
