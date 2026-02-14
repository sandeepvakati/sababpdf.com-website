import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { convertPdfToImages } from '../utils/conversionUtils';
import { FileImage, Download, File, Trash2, Archive } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const PdfToJpg = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null); // { type: 'single' | 'zip', url: string, name: string }

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setResult(null);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setResult(null);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const images = await convertPdfToImages(file);

            if (images.length === 0) {
                alert('No pages found in PDF.');
                return;
            }

            if (images.length === 1) {
                // Single image
                const url = URL.createObjectURL(images[0].blob);
                setResult({
                    type: 'single',
                    url: url,
                    name: images[0].name
                });
            } else {
                // Multiple images - Zip them
                const zip = new JSZip();
                images.forEach((img) => {
                    zip.file(img.name, img.blob);
                });

                const content = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(content);
                setResult({
                    type: 'zip',
                    url: url,
                    name: `${file.name.replace('.pdf', '')}_images.zip`
                });
            }

        } catch (error) {
            console.error('Error converting PDF to Images:', error);
            alert('Failed to convert PDF. It might be password protected or corrupted.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <FileImage className="h-8 w-8 text-yellow-500" />
                        PDF to JPG
                    </h1>
                    <p className="text-gray-600">
                        Extract all images from your PDF or convert each page to a JPG file.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-red-100 p-2 rounded">
                                        <File className="h-6 w-6 text-red-600" />
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
                                {result ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={result.url}
                                            download={result.name}
                                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {result.type === 'zip' ? <Archive className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                                            {result.type === 'zip' ? 'Download ZIP' : 'Download JPG'}
                                        </a>
                                        <p className="text-sm text-gray-500">
                                            {result.type === 'zip' ? 'All pages compressed into one ZIP file.' : 'Single high-quality JPG image.'}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to JPG'}
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

export default PdfToJpg;
