/**
 * CDN-based PDF.js loader — bypasses webpack/Next.js bundling entirely.
 * All pages and utilities should use this instead of `import * as pdfjsLib from 'pdfjs-dist'`.
 */

const PDFJS_VERSION = '4.2.67';
const CDN_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsLoadPromise = null;

/**
 * Load PDF.js from CDN. Returns the pdfjsLib global.
 * Safe to call multiple times — only loads once.
 */
export function loadPdfjs() {
    if (typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    // Already loaded
    if (window.pdfjsLib) {
        return Promise.resolve(window.pdfjsLib);
    }

    // Loading in progress
    if (pdfjsLoadPromise) {
        return pdfjsLoadPromise;
    }

    pdfjsLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${CDN_BASE}/pdf.min.mjs`;
        script.type = 'module';

        // pdf.min.mjs (ES module) sets window.pdfjsLib on some builds, but the
        // classic UMD build is more reliable for global access.
        // Use the classic (non-module) build instead:
        script.src = `${CDN_BASE}/pdf.min.js`;
        script.type = 'text/javascript';

        script.onload = () => {
            const lib = window.pdfjsLib;
            if (!lib) {
                reject(new Error('pdfjsLib not found on window after script load'));
                return;
            }
            lib.GlobalWorkerOptions.workerSrc = `${CDN_BASE}/pdf.worker.min.js`;
            resolve(lib);
        };

        script.onerror = () => {
            pdfjsLoadPromise = null;
            reject(new Error('Failed to load PDF.js from CDN'));
        };

        document.head.appendChild(script);
    });

    return pdfjsLoadPromise;
}
