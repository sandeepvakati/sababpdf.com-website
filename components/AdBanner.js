'use client';
import { useEffect } from 'react';

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || '';
const AD_SLOTS = {
  banner: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER || '',
  rectangle: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE || '',
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '',
};

function canRenderAds(slot) {
  return Boolean(PUBLISHER_ID && AD_SLOTS[slot]);
}

export function AdBanner({ slot = 'banner', className = '' }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && canRenderAds(slot) && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // AdSense can throw during local hot reload if a slot is initialized twice.
    }
  }, [slot]);

  const slotConfig = {
    banner: { minHeight: 90, format: 'auto' },
    rectangle: { minHeight: 250, format: 'rectangle' },
    sidebar: { minHeight: 280, format: 'vertical' },
  };

  if (!canRenderAds(slot)) {
    return null;
  }

  const currentSlot = slotConfig[slot] || slotConfig.banner;

  return (
    <aside
      className={`ad-shell ${className}`.trim()}
      aria-label="Advertisement"
      style={{
        width: '100%',
        minHeight: currentSlot.minHeight,
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      <div className="ad-label">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={AD_SLOTS[slot]}
        data-ad-format={currentSlot.format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}

export function AdInContent() {
  if (!canRenderAds('banner')) {
    return null;
  }

  return (
    <div style={{ margin: '40px 0', display: 'flex', justifyContent: 'center' }}>
      <AdBanner slot="banner" />
    </div>
  );
}

export function AdSidebar() {
  if (!canRenderAds('sidebar')) {
    return null;
  }

  return (
    <div style={{ position: 'sticky', top: 80 }}>
      <AdBanner slot="sidebar" />
    </div>
  );
}
