'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { unlockPdf } from '@/utils/conversionUtils';
import { Unlock, Download, File, Trash2 } from 'lucide-react';

const unlockPdfContent = {
    howToUse: [
        { title: 'Upload Your Protected PDF', description: 'Click the upload area or drag and drop the password-protected PDF file. SababPDF will load the file and prompt you to enter the password needed to unlock it.' },
        { title: 'Enter the Password', description: 'Type the current password that was used to protect the PDF. You must know the correct password — this tool removes the password requirement but cannot bypass unknown passwords.' },
        { title: 'Unlock and Download', description: 'Click "Unlock PDF" and SababPDF will create a new version of your document without the password restriction. Download the unlocked PDF and use it freely without entering a password.' },
    ],
    whyUseThis: [
        { title: 'Remove Password Hassle', description: 'Once you unlock a PDF, you can open, print, copy, and share it without remembering or entering the password every time. Perfect for archiving documents you access frequently.' },
        { title: 'Secure Processing', description: 'The unlocking process happens entirely in your browser. Your password and document are never sent to any external server, ensuring your sensitive information stays private.' },
        { title: 'Full PDF Functionality', description: 'After unlocking, the PDF works like any normal document. You can merge it, split it, compress it, add watermarks, or convert it to other formats using our other tools.' },
        { title: 'Free & Simple', description: 'No registration, no file size limits, and no usage restrictions. Simply upload, enter the password, and download your unlocked document.' },
    ],
    tips: [
        'You must know the current password to unlock a PDF. This tool cannot crack or bypass unknown passwords.',
        'If you receive a "wrong password" error, double-check that you are entering the correct password including proper capitalization and special characters.',
        'After unlocking, consider saving the unprotected PDF in a secure location so you do not need to unlock it again in the future.',
        'If you want to change the password instead of removing it, first unlock the PDF, then use our Protect PDF tool to set a new password.',
        'Some PDFs have permissions restrictions (like preventing printing) in addition to a password. Unlocking with the correct password removes all restrictions.',
    ],
    faqs: [
        { question: 'Can this tool crack a PDF password I do not know?', answer: 'No. This tool requires you to enter the correct password. It removes the password protection from the PDF so you can use it freely, but it cannot bypass or guess an unknown password. This is by design — if someone protected a PDF with a password, only authorized users with the password should be able to access it.' },
        { question: 'What types of PDF protection can this remove?', answer: 'This tool removes password-based protection including open passwords (needed to view the PDF) and permissions passwords (that restrict printing, copying, or editing). You need to provide the correct password for removal.' },
        { question: 'Will unlocking change my PDF content?', answer: 'No. The content, formatting, images, and all elements of your PDF remain exactly the same. The only difference is that the password requirement is removed from the new file.' },
        { question: 'Is my password safe during the process?', answer: 'Yes. Your password is processed entirely in your browser\'s local memory. It is never transmitted over the internet, stored in cookies, or logged anywhere. Once the unlocked PDF is created, the password is discarded.' },
        { question: 'What if I need to re-protect the PDF later?', answer: 'After unlocking your PDF, you can use our Protect PDF tool to add a new password at any time. You can also set a different password from the original one.' },
    ],
    relatedTools: [
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Repair PDF', href: '/repair-pdf', icon: '🛠️' },
    ],
};

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
                                            className="w-full px-4 py-2 border border-gray-300 outline-none rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
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

            <ToolPageContent
                title="Unlock PDF Files"
                howToUse={unlockPdfContent.howToUse}
                whyUseThis={unlockPdfContent.whyUseThis}
                tips={unlockPdfContent.tips}
                faqs={unlockPdfContent.faqs}
                relatedTools={unlockPdfContent.relatedTools}
            />
        </div>
    );
};

export default UnlockPdf;
