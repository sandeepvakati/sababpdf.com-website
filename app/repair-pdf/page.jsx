'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { repairPdf } from '@/utils/pdfUtils';
import { Wrench, Download, FileJson, Trash2, AlertTriangle } from 'lucide-react';

const repairPdfContent = {
    howToUse: [
        { title: 'Upload the Damaged PDF', description: 'Click the upload area or drag and drop your corrupted or damaged PDF file. SababPDF will attempt to read and analyze the file structure to identify the issues.' },
        { title: 'Start the Repair', description: 'Click the "Repair PDF" button. SababPDF will process the file, attempting to reconstruct the internal PDF structure, recover pages, and fix common corruption issues.' },
        { title: 'Download the Repaired File', description: 'If the repair is successful, download the fixed PDF. The repaired file should open correctly in any standard PDF reader. Some content from severely corrupted files may not be fully recoverable.' },
    ],
    whyUseThis: [
        { title: 'Recover Important Documents', description: 'Do not lose important documents due to file corruption. SababPDF attempts to recover as much content as possible from damaged PDF files, potentially saving hours of recreation work.' },
        { title: 'Fix Common PDF Errors', description: 'Repairs common issues like damaged cross-reference tables, missing object references, truncated files, and incomplete downloads that prevent PDFs from opening properly.' },
        { title: 'No Software Installation', description: 'Repair damaged PDFs directly in your browser without downloading or installing any desktop software. Works on any device with a modern web browser.' },
        { title: 'Private Processing', description: 'Your damaged document is processed entirely in your browser. Sensitive files are never uploaded to any server, keeping your data secure even during the repair process.' },
    ],
    tips: [
        'If the repair tool cannot fix your PDF, try opening the file in Google Chrome or Firefox first — these browsers have built-in PDF viewers that can sometimes handle slightly corrupted files.',
        'Always keep backup copies of important PDF files to avoid data loss from corruption.',
        'PDF corruption often happens during incomplete downloads or file transfers. Try re-downloading the file from its source before using the repair tool.',
        'For PDFs that were corrupted during email attachment, ask the sender to try sending the file again, possibly in a ZIP archive to prevent transmission errors.',
        'If the repaired PDF is missing some pages or content, the original damage may have been too severe for full recovery. In such cases, try to obtain the original source document.',
    ],
    faqs: [
        { question: 'What types of PDF damage can this tool fix?', answer: 'SababPDF can repair common issues including damaged internal structure (cross-reference tables), incomplete page trees, missing font references, and truncated file data. It works best with PDFs that were partially downloaded or corrupted during transfer.' },
        { question: 'Can it recover all content from a damaged PDF?', answer: 'The recovery depends on the severity of the damage. Minor corruption (like damaged headers or cross-references) is usually fully recoverable. Severe corruption (large portions of the file are missing or overwritten) may result in partial recovery or failure.' },
        { question: 'Will the repaired PDF look exactly like the original?', answer: 'In most cases, yes. The repair process attempts to reconstruct the file without modifying the actual content. However, if specific elements were corrupted, those parts may be missing or appear differently in the repaired version.' },
        { question: 'Can I repair a password-protected corrupted PDF?', answer: 'If the PDF is both corrupted and password-protected, repair may be more challenging. The tool will attempt to fix the file, but if the encryption data itself is corrupted, the repair may not succeed. Try the repair first, and if it works, you can then use the Unlock PDF tool.' },
        { question: 'Is there a file size limit for repair?', answer: 'There is no strict size limit. However, since repair processing happens in your browser, very large files may take longer and could potentially run into browser memory limits on devices with less RAM.' },
    ],
    relatedTools: [
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Unlock PDF', href: '/unlock-pdf', icon: '🔓' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
    ],
};

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
                                        {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Repairing...
                                        </span>
                                    ) : (
                                        'Repair PDF'
                                    )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Repair PDF Files"
                howToUse={repairPdfContent.howToUse}
                whyUseThis={repairPdfContent.whyUseThis}
                tips={repairPdfContent.tips}
                faqs={repairPdfContent.faqs}
                relatedTools={repairPdfContent.relatedTools}
            />
        </div>
    );
};

export default RepairPdf;
