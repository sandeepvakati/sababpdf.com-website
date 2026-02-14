import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { addPageNumbers } from '../utils/conversionUtils';
import { Hash, Download, File, Trash2, LayoutTemplate } from 'lucide-react';

const AddPageNumbers = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [position, setPosition] = useState('bottom-center');

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
            const pdfBlob = await addPageNumbers(file, position);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error adding page numbers:', error);
            alert('Failed to add page numbers.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Hash className="h-8 w-8 text-pink-600" />
                        Page Numbers
                    </h1>
                    <p className="text-gray-600">
                        Add page numbers to your PDF document with ease.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-pink-100 p-2 rounded">
                                        <File className="h-6 w-6 text-pink-600" />
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

                            <div className="flex flex-col items-center gap-4">
                                <label className="text-sm font-medium text-gray-700">Position</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setPosition('bottom-left')}
                                        className={`px-4 py-2 rounded-lg border transition-all ${position === 'bottom-left' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-pink-300'}`}
                                    >
                                        Bottom Left
                                    </button>
                                    <button
                                        onClick={() => setPosition('bottom-center')}
                                        className={`px-4 py-2 rounded-lg border transition-all ${position === 'bottom-center' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-pink-300'}`}
                                    >
                                        Bottom Center
                                    </button>
                                    <button
                                        onClick={() => setPosition('bottom-right')}
                                        className={`px-4 py-2 rounded-lg border transition-all ${position === 'bottom-right' ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-pink-300'}`}
                                    >
                                        Bottom Right
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`numbered_${file.name}`}
                                            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download PDF
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Processing...' : 'Add Page Numbers'}
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

export default AddPageNumbers;
