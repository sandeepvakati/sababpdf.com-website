'use client';

import { useEffect, useRef } from 'react';

export default function AdBanner({ slot, format = 'auto', responsive = 'true' }) {
    const adRef = useRef(null);

    useEffect(() => {
        try {
            if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error('AdSense error', e);
        }
    }, []);

    return (
        <div className="w-full flex justify-center my-4 overflow-hidden">
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block', width: '100%' }}
                data-ad-client="ca-pub-1647209378622119"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
}
