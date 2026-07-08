import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function AdSlider() {
  const [ads, setAds] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    apiFetch('/admin/ads')
      .then(data => setAds(data))
      .catch(() => {}); // silently fail — no ads just means no slider
  }, []);

  const prev = useCallback(() =>
    setCurrent(c => (c - 1 + ads.length) % ads.length), [ads.length]);
  const next = useCallback(() =>
    setCurrent(c => (c + 1) % ads.length), [ads.length]);

  // Auto-play every 3.5 seconds
  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(next, 3500);
    return () => clearInterval(t);
  }, [ads.length, next]);

  if (!ads.length) return null;

  const ad = ads[current];

  return (
    <div className="ad-slider">
      {/* Slide */}
      {ad.link ? (
        <a href={ad.link} target="_blank" rel="noopener noreferrer" className="ad-slide-link">
          <img src={ad.imageUrl} alt={ad.title || 'Advertisement'} className="ad-img" />
          {ad.title && (
            <div className="ad-caption">
              <span>{ad.title}</span>
              <ExternalLink size={12} />
            </div>
          )}
        </a>
      ) : (
        <div className="ad-slide-link">
          <img src={ad.imageUrl} alt={ad.title || 'Advertisement'} className="ad-img" />
          {ad.title && <div className="ad-caption"><span>{ad.title}</span></div>}
        </div>
      )}

      {/* Controls */}
      {ads.length > 1 && (
        <>
          <button onClick={prev} className="ad-arrow ad-arrow--left" aria-label="Previous">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} className="ad-arrow ad-arrow--right" aria-label="Next">
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="ad-dots">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`ad-dot ${i === current ? 'ad-dot--active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
