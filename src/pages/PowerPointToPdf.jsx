import React, { useState } from 'react';
import FeatureCard from '../components/FeatureCard';
import { Presentation, FileText, ArrowRight, Download, Loader2, AlertCircle } from 'lucide-react';
import { powerPointToPdf } from '../utils/conversionUtils';

const PowerPointToPdf = () => {
    const [file, setFile] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);
    const [useProfessional, setUseProfessional] = useState(false);

    // Backend API URL - Connected to EC2 (HTTPS)
    const BACKEND_URL = 'https://sababpdf.com';

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check if it's a PPTX file
            if (
                selectedFile.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                selectedFile.name.toLowerCase().endsWith('.pptx')
            ) {
                setFile(selectedFile);
                setError(null);
                setDownloadUrl(null);
            } else if (selectedFile.name.toLowerCase().endsWith('.ppt')) {
                setFile(null);
                setError('The .ppt format is an older version not supported by this tool. Please open your file in PowerPoint and save it as a modern .pptx file, then try again.');
            } else {
                setFile(null);
                setError('Please select a valid PowerPoint (.pptx) file.');
            }
        }
    };

    const handleConvertProfessional = async () => {
        if (!file) return;

        setIsConverting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BACKEND_URL}/convert/pptx-to-pdf`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Conversion failed on server');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
        } catch (err) {
            console.error(err);
            setError('Professional conversion failed. The server might be starting up (first request takes ~30s). Please try again.');
        } finally {
            setIsConverting(false);
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        if (useProfessional) {
            return handleConvertProfessional();
        }

        setIsConverting(true);
        setError(null);

        try {
            const pdfBlob = await powerPointToPdf(file);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (err) {
            console.error(err);
            setError('An error occurred during conversion. Please try again. Note: Only .pptx files are supported.');
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">PowerPoint to PDF Converter</h1>
                    <p className="text-lg text-gray-600">
                        Convert your PowerPoint presentations to PDF documents.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        <AlertCircle className="h-4 w-4" />
                        <span>Basic Extractor: Converts text and basic slide structure. Complex layouts/images might be simplified.</span>
                    </div>
                </div>

                <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload PowerPoint File (.pptx)
                            </label>
                            <input
                                type="file"
                                accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-red-50 file:text-red-700
                                hover:file:bg-red-100"
                            />
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>

                        {file && !downloadUrl && (
                            <div className="w-full space-y-4">
                                {/* Conversion Mode Toggle */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useProfessional}
                                            onChange={(e) => setUseProfessional(e.target.checked)}
                                            className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                🚀 Use Professional Conversion (LibreOffice)
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {useProfessional ? (
                                                    <span className="text-green-700">
                                                        ✅ Best quality • Preserves all formatting • May take 10-30 seconds
                                                    </span>
                                                ) : (
                                                    <span>
                                                        ⚡ Fast basic conversion • Good for simple slides
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {/* File Preview */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                                        <Presentation className="h-8 w-8 text-orange-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-400" />
                                        <FileText className="h-8 w-8 text-red-600" />
                                    </div>
                                    <button
                                        onClick={handleConvert}
                                        disabled={isConverting}
                                        className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isConverting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Converting...
                                            </>
                                        ) : (
                                            'Convert to PDF'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {downloadUrl && (
                            <div className="text-center w-full bg-green-50 p-6 rounded-xl border border-green-200">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Conversion Complete!</h3>
                                <p className="text-sm text-gray-600 mb-6">Your PowerPoint has been converted to PDF.</p>
                                <a
                                    href={downloadUrl}
                                    download={file.name.replace(/\.pptx?$/, '.pdf')}
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                                >
                                    <Download className="h-5 w-5" />
                                    Download PDF
                                </a>
                                <button
                                    onClick={() => { setFile(null); setDownloadUrl(null); }}
                                    className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Convert another file
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PowerPointToPdf;
