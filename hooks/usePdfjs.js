'use client';

import { useState, useEffect } from 'react';
import { loadPdfjs } from '@/utils/loadPdfjs';

/**
 * React hook to load PDF.js from CDN.
 * Returns { pdfjsLib, loading, error }.
 */
export default function usePdfjs() {
    const [pdfjsLib, setPdfjsLib] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        loadPdfjs()
            .then((lib) => {
                if (!cancelled) {
                    setPdfjsLib(lib);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err);
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, []);

    return { pdfjsLib, loading, error };
}
