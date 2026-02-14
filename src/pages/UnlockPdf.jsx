import { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { unlockPdf } from '../utils/conversionUtils';
import { Unlock, Download, File, Trash2 } from 'lucide-react';

const UnlockPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleFileSelected = (files) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadUrl(null);
            setError('');
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setError('');
        setPassword('');
    };

    const handleConvert = async () => {
        if (!file || !password) return;

        setIsProcessing(true);
        setError('');
        try {
            const pdfBlob = await unlockPdf(file, password);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error unlocking PDF:', error);
            if (error.message.includes('Incorrect password')) {
                setError('Incorrect password. Please try again.');
            } else {
                setError('Failed to unlock PDF. The file might be corrupted or the password is wrong.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Unlock className="h-8 w-8 text-cyan-600" />
                        Unlock PDF
                    </h1>
                    <p className="text-gray-600">
                        Remove password and restrictions from your PDF.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-cyan-100 p-2 rounded">
                                        <File className="h-6 w-6 text-cyan-600" />
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
                                <div className="w-full max-w-md space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password to unlock"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                                        />
                                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`unlocked_${file.name}`}
                                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Unlocked PDF
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing || !password}
                                        className={`flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing || !password ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Unlocking...' : 'Unlock PDF'}
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

export default UnlockPdf;
