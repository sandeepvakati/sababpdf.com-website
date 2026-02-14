import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { convertPdfToPpt } from '../utils/conversionUtils';
import { Presentation, Download, File, Trash2 } from 'lucide-react';

const PdfToPowerPoint = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

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
            const pptBlob = await convertPdfToPpt(file);
            const url = URL.createObjectURL(pptBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting PDF to PowerPoint:', error);
            alert('Failed to convert PDF file. Please try a different document.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Presentation className="h-8 w-8 text-orange-600" />
                        PDF to PowerPoint
                    </h1>
                    <p className="text-gray-600">
                        Convert your PDF files to editable PowerPoint presentations.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-orange-100 p-2 rounded">
                                        <File className="h-6 w-6 text-orange-600" />
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

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`${file.name.replace(/\.[^/.]+$/, "")}.pptx`}
                                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download PowerPoint
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to PowerPoint'}
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

export default PdfToPowerPoint;
