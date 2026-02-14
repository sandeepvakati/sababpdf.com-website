import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { convertPdfToExcel } from '../utils/conversionUtils';
import { FileSpreadsheet, Download, FileJson, Trash2 } from 'lucide-react';

const PdfToExcel = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const [useOcr, setUseOcr] = useState(false);

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            // Reset OCR option when new file is selected, or keep it? 
            // Better to keep user choice or reset? Let's keep it manual.
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setUseOcr(false);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const excelBlob = await convertPdfToExcel(file, { useOcr });
            const url = URL.createObjectURL(excelBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting PDF to Excel:', error);
            alert(error.message || 'Failed to convert PDF file. Please try a different document.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        PDF to Excel
                    </h1>
                    <p className="text-gray-600">
                        Convert your PDF files to editable Excel spreadsheets.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 p-2 rounded">
                                        <FileJson className="h-6 w-6 text-green-600" />
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

                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useOcr"
                                    checked={useOcr}
                                    onChange={(e) => setUseOcr(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="useOcr" className="text-gray-700 font-medium select-none cursor-pointer">
                                    Use OCR (for Scanned Documents/Images)
                                </label>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`${file.name.replace(/\.[^/.]+$/, "")}.xlsx`}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Excel
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to Excel'}
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

export default PdfToExcel;
