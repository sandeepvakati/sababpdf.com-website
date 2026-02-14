import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { convertImageToPdf } from '../utils/conversionUtils';
import { Image, Download, File, Trash2, Plus } from 'lucide-react';

const JpgToPdf = () => {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFilesSelected = (newFiles) => {
        // Append new files to existing ones for JPG to PDF (often users want multiple images in one PDF)
        setFiles(prev => [...prev, ...newFiles]);
        setDownloadUrl(null);
    };

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setDownloadUrl(null);
    };

    const handleConvert = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        try {
            const pdfBlob = await convertImageToPdf(files);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting Images to PDF:', error);
            alert('Failed to convert images. Please ensure they are valid JPG or PNG files.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Image className="h-8 w-8 text-yellow-500" />
                        JPG into PDF
                    </h1>
                    <p className="text-gray-600">
                        Convert your JPG images to PDF. Adjust the order and merge them into a single file.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <FileUploader onFilesSelected={handleFilesSelected} multiple={true} accept=".jpg,.jpeg,.png" />

                    {files.length > 0 && (
                        <div className="mt-8 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {files.map((file, index) => (
                                    <div key={index} className="relative group p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center">
                                        <div className="h-32 w-full flex items-center justify-center overflow-hidden rounded bg-gray-200 mb-2">
                                            {/* Preview image */}
                                            <img src={URL.createObjectURL(file)} alt={file.name} className="object-cover h-full w-full" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 truncate w-full text-center">{file.name}</p>
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="absolute top-2 right-2 p-1 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-center pt-6 border-t border-gray-100">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download="converted_images.pdf"
                                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download PDF
                                        </a>
                                        <button
                                            onClick={() => setDownloadUrl(null)}
                                            className="block mx-auto text-sm text-gray-500 hover:text-gray-700 underline"
                                        >
                                            Convert more
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
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

export default JpgToPdf;
