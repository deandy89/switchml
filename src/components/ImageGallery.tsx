'use client';

import { useState } from 'react';

export default function ImageGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) return null;

  return (
    <div>
      {/* Main Image */}
      <div style={{
        width: '100%', height: 320, borderRadius: '0.75rem', overflow: 'hidden',
        background: `url(${images[activeIndex]}) center/cover`,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
        marginBottom: images.length > 1 ? '0.75rem' : 0,
      }} />

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {images.map((url, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}
              style={{
                width: 64, height: 48, borderRadius: '0.4rem', overflow: 'hidden',
                border: i === activeIndex ? '2px solid #00d1ff' : '2px solid transparent',
                boxShadow: i === activeIndex ? '0 0 10px #00d1ff40' : 'none',
                background: `url(${url}) center/cover`,
                cursor: 'pointer', flexShrink: 0, padding: 0,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
