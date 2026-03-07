'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { protectPdf } from '@/utils/conversionUtils';
import { Lock, Download, File, Trash2, ShieldCheck } from 'lucide-react';

const protectPdfContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop the PDF file you want to protect. SababPDF will load your document and prepare it for encryption.' },
        { title: 'Set a Strong Password', description: 'Enter a password in the "Set Password" field and confirm it. Choose a strong password that combines letters, numbers, and symbols for maximum security. Anyone who wants to open the protected PDF will need this password.' },
        { title: 'Protect and Download', description: 'Click "Protect PDF" and SababPDF will encrypt your document with the password. Download the protected file and share it securely, knowing that only people with the password can open it.' },
    ],
    whyUseThis: [
        { title: 'Strong AES Encryption', description: 'SababPDF uses industry-standard AES encryption to protect your PDF. This is the same encryption standard used by governments and financial institutions worldwide to secure sensitive data.' },
        { title: 'No Server Upload', description: 'The encryption process happens entirely in your browser. Your sensitive documents and passwords are never transmitted over the internet or stored on any server.' },
        { title: 'Universal Protection', description: 'The protected PDF works in all standard PDF readers including Adobe Acrobat, Preview, Chrome, Firefox, and mobile PDF apps. Recipients simply enter the password to access the document.' },
        { title: 'Free & Unlimited', description: 'Protect as many PDFs as you need without any cost, file size limits, or registration requirements. No watermarks are added to your protected documents.' },
    ],
    tips: [
        'Use a strong password with at least 8 characters including uppercase, lowercase, numbers, and symbols for maximum security.',
        'Keep your password in a safe place. If you forget the password, there is no way to recover access to a protected PDF.',
        'Share the password through a separate channel from the PDF. For example, send the PDF via email and the password via text message.',
        'For documents that need both password protection and visual branding, use our Add Watermark tool before protecting the PDF.',
        'If you need to remove password protection later, use our Unlock PDF tool (you will need to know the current password).',
    ],
    faqs: [
        { question: 'Can someone crack the password?', answer: 'The AES encryption used by SababPDF is extremely strong and is considered virtually unbreakable with a good password. However, weak passwords (like "123456") can be guessed. Always use a strong, unique password for important documents.' },
        { question: 'Will the protected PDF work in all PDF readers?', answer: 'Yes. Password-protected PDFs are a standard PDF feature supported by Adobe Acrobat, Preview (Mac), Chrome, Firefox, Microsoft Edge, and virtually all mobile PDF apps. Recipients will be prompted to enter the password when opening the file.' },
        { question: 'Can I protect a PDF that is already password-protected?', answer: 'You would need to unlock the existing PDF first using our Unlock PDF tool, then apply a new password. You cannot add a second layer of password protection on top of an existing one.' },
        { question: 'Does password protection change the PDF content?', answer: 'No. The content, formatting, images, and all other elements of your PDF remain completely unchanged. Only a password requirement is added to control access.' },
        { question: 'Is my password stored anywhere?', answer: 'No. The password is used only during the encryption process in your browser and is never stored, logged, or transmitted. Once the protected PDF is created, the password exists only in the encrypted file itself.' },
    ],
    relatedTools: [
        { name: 'Unlock PDF', href: '/unlock-pdf', icon: '🔓' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'Repair PDF', href: '/repair-pdf', icon: '🛠️' },
    ],
};

const ProtectPdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
        if (!file || !password) return;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setIsProcessing(true);
        try {
            const pdfBlob = await protectPdf(file, password);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error protecting PDF:', error);
            alert('Failed to protect PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-emerald-600" />
                        Protect PDF
                    </h1>
                    <p className="text-gray-600">
                        Encrypt your PDF with a password.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-emerald-100 p-2 rounded">
                                        <File className="h-6 w-6 text-emerald-600" />
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="w-full px-4 py-2 border border-gray-300 outline-none rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            className="w-full px-4 py-2 border border-gray-300 outline-none rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`protected_${file.name}`}
                                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Protected PDF
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing || !password || !confirmPassword}
                                        className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing || !password || !confirmPassword ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Protecting...
                                        </span>
                                    ) : (
                                        'Protect PDF'
                                    )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Protect PDF with Password"
                howToUse={protectPdfContent.howToUse}
                whyUseThis={protectPdfContent.whyUseThis}
                tips={protectPdfContent.tips}
                faqs={protectPdfContent.faqs}
                relatedTools={protectPdfContent.relatedTools}
            />
        </div>
    );
};

export default ProtectPdf;
