import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { repairPdf } from '../utils/pdfUtils';
import { Wrench, Download, FileJson, Trash2, AlertTriangle } from 'lucide-react';

const RepairPdf = () => {
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

    const handleRepair = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const repairedBlob = await repairPdf(file);
            const url = URL.createObjectURL(repairedBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error repairing PDF:', error);
            alert('Failed to repair PDF. The file might be too corrupted or password protected.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Wrench className="h-8 w-8 text-blue-500" />
                        Repair PDF file
                    </h1>
                    <p className="text-gray-600">
                        Recover data using the repair tool from a corrupted or damaged PDF file.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-red-100 p-2 rounded">
                                        <AlertTriangle className="h-6 w-6 text-red-500" />
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
                                        <p className="text-green-600 font-medium flex items-center gap-2 justify-center">
                                            <Wrench className="h-5 w-5" />
                                            PDF Repaired Successfully!
                                        </p>
                                        <a
                                            href={downloadUrl}
                                            download={`repaired_${file.name}`}
                                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Repaired PDF
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleRepair}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Repairing...' : 'Repair PDF'}
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

export default RepairPdf;
