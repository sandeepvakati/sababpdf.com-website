import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { rotatePdf } from '../utils/conversionUtils';
import { RotateCw, Download, File, Trash2, RotateCcw, RefreshCcw } from 'lucide-react';

const RotatePdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [rotation, setRotation] = useState(90); // Default rotation

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const pdfBlob = await rotatePdf(file, rotation);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error rotating PDF:', error);
            alert('Failed to rotate PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <RotateCw className="h-8 w-8 text-indigo-600" />
                        Rotate PDF
                    </h1>
                    <p className="text-gray-600">
                        Rotate your PDF pages permanently.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-indigo-100 p-2 rounded">
                                        <File className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setRotation(90)}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${rotation === 90 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                                >
                                    <RotateCw className="h-8 w-8 mb-2" />
                                    <span className="font-medium">Right 90°</span>
                                </button>
                                <button
                                    onClick={() => setRotation(-90)}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${rotation === -90 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                                >
                                    <RotateCcw className="h-8 w-8 mb-2" />
                                    <span className="font-medium">Left 90°</span>
                                </button>
                                <button
                                    onClick={() => setRotation(180)}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${rotation === 180 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                                >
                                    <RefreshCcw className="h-8 w-8 mb-2" />
                                    <span className="font-medium">180°</span>
                                </button>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`rotated_${file.name}`}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Rotated PDF
                                        </a>
                                        <button
                                            onClick={() => setDownloadUrl(null)}
                                            className="block mx-auto text-sm text-gray-500 hover:text-gray-700 underline"
                                        >
                                            Rotate another way
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Rotating...' : 'Rotate PDF'}
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

export default RotatePdf;
