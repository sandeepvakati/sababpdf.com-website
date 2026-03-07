let pdfjsLib = null;

export async function loadPdfjs() {
    if (typeof window === 'undefined') {
        return null;
    }

    if (pdfjsLib) return pdfjsLib;

    try {
        const pdfjs = await import('pdfjs-dist');
        pdfjsLib = pdfjs.default || pdfjs;
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        return pdfjsLib;
    } catch (error) {
        throw new Error('Failed to load PDF.js: ' + error.message);
    }
}
