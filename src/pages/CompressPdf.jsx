import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { compressPdf } from '../utils/pdfUtils';
import { Minimize2, Download, FileJson, Trash2 } from 'lucide-react';

const CompressPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [compressedSize, setCompressedSize] = useState(null);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setCompressedSize(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setCompressedSize(null);
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const compressedBlob = await compressPdf(file);
            const url = URL.createObjectURL(compressedBlob);
            setDownloadUrl(url);
            setCompressedSize(compressedBlob.size);
        } catch (error) {
            console.error('Error compressing PDF:', error);
            alert('Failed to compress PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Minimize2 className="h-8 w-8 text-blue-500" />
                        Compress PDF file
                    </h1>
                    <p className="text-gray-600">
                        Reduce file size while optimizing for maximal PDF quality.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">Original size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <p className="text-green-600 font-medium">
                                            Size after compression: {(compressedSize / 1024 / 1024).toFixed(2)} MB
                                            <span className="ml-2 text-sm text-gray-500">
                                                ({Math.round(((file.size - compressedSize) / file.size) * 100)}% smaller)
                                            </span>
                                        </p>
                                        <a
                                            href={downloadUrl}
                                            download={`compressed_${file.name}`}
                                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Compressed PDF
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleCompress}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Compressing...' : 'Compress PDF'}
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

export default CompressPdf;
