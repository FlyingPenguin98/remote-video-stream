import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

// No client-side seeking here: transcoded streams already begin at the resume
// offset (server runs ffmpeg -ss), so playback always starts at position 0 of
// the manifest.
export function useHls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string | null
) {
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!src || !video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
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
      video.play().catch(() => {});
    }
  }, [src]);
}
