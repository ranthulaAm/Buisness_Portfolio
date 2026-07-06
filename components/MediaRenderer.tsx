import React, { useEffect, useRef, useState } from 'react';

interface MediaRendererProps {
  src?: string;
  alt?: string;
  className?: string;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({ src, alt, className }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const lowerSrc = (src || '').toLowerCase();
  const isVideoCheck = !!src && (lowerSrc.includes('.mp4') || lowerSrc.includes('.webm') || lowerSrc.includes('.mov') || lowerSrc.includes('.ogg'));

  useEffect(() => {
    if (!src || !isVideoCheck) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          } else {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
            }
          }
        });
      },
      { rootMargin: '800px' }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [src, isVideoCheck]);

  if (!src) return null;

  if (isVideoCheck) {
    return (
      <video
        ref={videoRef}
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={(e) => {
          e.currentTarget.style.display = 'none';
      }}
    />
  );
};

