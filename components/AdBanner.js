'use client';
import { useEffect } from 'react';

// ============================================================
// REPLACE YOUR ADSENSE DETAILS:
// Publisher ID: ca-pub-XXXXXXXXXX
// Ad Slot IDs: Replace each AD_SLOT_XXX with your actual slot IDs
// ============================================================

const PUBLISHER_ID = 'ca-pub-XXXXXXXXXX'; // Replace with your real publisher ID

const AD_SLOTS = {
  banner: 'XXXXXXXXXX',       // 728x90 leaderboard
  rectangle: 'XXXXXXXXXX',   // 300x250 medium rectangle  
  sidebar: 'XXXXXXXXXX',     // 300x600 half page
};

export function AdBanner({ slot = 'banner', className = '' }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {}
  }, []);

  const sizes = {
    banner: { width: '100%', height: 90, style: 'display:inline-block;width:728px;height:90px' },
    rectangle: { width: 300, height: 250, style: 'display:inline-block;width:300px;height:250px' },
    sidebar: { width: 300, height: 600, style: 'display:inline-block;width:300px;height:600px' },
  };

  const s = sizes[slot] || sizes.banner;

  // DEVELOPMENT: Show placeholder when AdSense not loaded
  if (PUBLISHER_ID === 'ca-pub-XXXXXXXXXX') {
    return (
      <div className={className} style={{
        width: s.width, height: s.height, background: '#f1f5f9',
        border: '1px dashed #cbd5e1', borderRadius: 8,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4,
      }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Advertisement
        </span>
        <span style={{ fontSize: 10, color: '#cbd5e1' }}>
          Add your AdSense publisher ID in AdBanner.js
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={{ overflow: 'hidden', textAlign: 'center' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={AD_SLOTS[slot]}
        data-ad-format={slot === 'banner' ? 'auto' : 'rectangle'}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function AdInContent() {
  return (
    <div style={{ margin: '32px 0', display: 'flex', justifyContent: 'center' }}>
      <AdBanner slot="banner" />
    </div>
  );
}

export function AdSidebar() {
  return (
    <div style={{ position: 'sticky', top: 80 }}>
      <AdBanner slot="sidebar" />
    </div>
  );
}
