import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { splitPdf, getPdfPageCount } from '../utils/pdfUtils';
import { Scissors, Download, FileJson, Trash2 } from 'lucide-react';

const SplitPdf = () => {
    const [file, setFile] = useState(null);
    const [pageCount, setPageCount] = useState(0);
    const [range, setRange] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFileSelected = async (files) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setRange('');
            setDownloadUrl(null);

            try {
                const count = await getPdfPageCount(selectedFile);
                setPageCount(count);
                setRange(`1-${count}`); // Default to all pages
            } catch (error) {
                console.error("Error reading PDF", error);
                alert("Invalid PDF file");
                setFile(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setPageCount(0);
        setRange('');
        setDownloadUrl(null);
    };

    const parseRange = (rangeStr, maxPages) => {
        const pages = new Set();
        const parts = rangeStr.split(',').map(p => p.trim());

        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pages.add(i - 1); // 0-based index
                    }
                }
            } else {
                const page = Number(part);
                if (!isNaN(page) && page >= 1 && page <= maxPages) {
                    pages.add(page - 1);
                }
            }
        });

        return Array.from(pages).sort((a, b) => a - b);
    };

    const handleSplit = async () => {
        if (!file) return;

        const pageIndices = parseRange(range, pageCount);
        if (pageIndices.length === 0) {
            alert("Please enter a valid page range.");
            return;
        }

        setIsProcessing(true);
        try {
            const splitPdfBlob = await splitPdf(file, pageIndices);
            const url = URL.createObjectURL(splitPdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error splitting PDF:', error);
            alert('Failed to split PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Scissors className="h-8 w-8 text-green-500" />
                        Split PDF file
                    </h1>
                    <p className="text-gray-600">
                        Extract pages from your PDF file.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-red-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">{pageCount} Pages • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div>
                                <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-1">
                                    Page Range (e.g., 1-5, 8, 11-13)
                                </label>
                                <input
                                    type="text"
                                    id="range"
                                    value={range}
                                    onChange={(e) => setRange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="1-5, 8, 11-13"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Total pages available: {pageCount}
                                </p>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <a
                                        href={downloadUrl}
                                        download={`split_${file.name}`}
                                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Download className="h-5 w-5" />
                                        Download Extracted PDF
                                    </a>
                                ) : (
                                    <button
                                        onClick={handleSplit}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Processing...' : 'Split PDF'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SplitPdf;
