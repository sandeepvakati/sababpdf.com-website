'use client';

import { useState, useEffect } from 'react';
import { loadPdfjs } from '@/utils/loadPdfjs';

export function usePdfjs() {
    const [pdfjs, setPdfjs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPdfjs()
            .then((lib) => {
                setPdfjs(lib);
                setLoading(false);
            })
            .catch((err) => {
                setError(err?.message || 'Failed to load PDF.js');
                setLoading(false);
            });
    }, []);

    return { pdfjs, loading, error };
}

export default usePdfjs;
