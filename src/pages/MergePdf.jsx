import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { mergePdfs } from '../utils/pdfUtils';
import { Layers, Download, X } from 'lucide-react';

const MergePdf = () => {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFilesSelected = (newFiles) => {
        setFiles((prev) => [...prev, ...newFiles]);
        setDownloadUrl(null); // Reset download if new files are added
    };

    const handleRemoveFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setDownloadUrl(null);
    };

    const handleMerge = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        try {
            const mergedPdfBlob = await mergePdfs(files);
            const url = URL.createObjectURL(mergedPdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Failed to merge PDFs. Please ensure all files are valid PDFs.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Layers className="h-8 w-8 text-red-500" />
                        Merge PDF files
                    </h1>
                    <p className="text-gray-600">
                        Combine PDFs in the order you want with the easiest PDF merger available.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {files.length === 0 ? (
                        <FileUploader onFilesSelected={handleFilesSelected} />
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-700">{files.length} Files Selected</h2>
                                <button
                                    onClick={() => document.getElementById('add-more-input').click()}
                                    className="text-red-500 font-medium hover:text-red-700 text-sm"
                                >
                                    + Add more files
                                </button>
                                <input
                                    id="add-more-input"
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept=".pdf"
                                    onChange={(e) => handleFilesSelected(Array.from(e.target.files))}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="bg-red-100 p-2 rounded">
                                                <Layers className="h-5 w-5 text-red-500" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
                                            <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 flex justify-center">
                                {downloadUrl ? (
                                    <a
                                        href={downloadUrl}
                                        download="merged_document.pdf"
                                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Download className="h-5 w-5" />
                                        Download Merged PDF
                                    </a>
                                ) : (
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Merging...' : 'Merge PDFs'}
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

export default MergePdf;
