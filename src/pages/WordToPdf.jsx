import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { convertWordToPdf } from '../utils/conversionUtils';
import { FileText, Download, FileJson, Trash2 } from 'lucide-react';

const WordToPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

            if (fileExtension === 'doc') {
                alert('This tool currently supports .docx files only. Please save your file as .docx and try again.');
                return;
            }

            setFile(selectedFile);
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
            const pdfBlob = await convertWordToPdf(file);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting Word to PDF:', error);
            alert('Failed to convert Word file. Please try a simpler document.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-blue-600" />
                        Word to PDF
                    </h1>
                    <p className="text-gray-600">
                        Convert your DOC and DOCX files to PDF instantly.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".docx" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-blue-600" />
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
                                            download={`${file.name.replace(/\.[^/.]+$/, "")}.pdf`}
                                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download PDF
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to PDF'}
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

export default WordToPdf;
