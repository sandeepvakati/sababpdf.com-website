'use client';
import { useState, useEffect } from 'react';

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) setShow(true);
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#1e293b', color: 'white', padding: '16px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            zIndex: 9999, flexWrap: 'wrap', gap: '12px'
        }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
                We use cookies to improve your experience and show relevant ads.
                See our <a href="/privacy-policy" style={{ color: '#60a5fa' }}>Privacy Policy</a>.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { localStorage.setItem('cookie-consent', 'declined'); setShow(false); }}
                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #64748b', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                    Decline
                </button>
                <button onClick={accept}
                    style={{ padding: '8px 16px', background: '#2563eb', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                    Accept All
                </button>
            </div>
        </div>
    );
}
