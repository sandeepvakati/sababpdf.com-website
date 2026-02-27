'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { rotatePdf } from '@/utils/conversionUtils';
import { RotateCw, Download, File, Trash2, RotateCcw, RefreshCcw } from 'lucide-react';

const rotatePdfContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop your PDF file. SababPDF will load your document and show you rotation options.' },
        { title: 'Choose Rotation Direction', description: 'Select how you want to rotate your pages: Right 90° (clockwise quarter turn), Left 90° (counter-clockwise quarter turn), or 180° (flip upside down). The rotation is applied to all pages in the document.' },
        { title: 'Rotate and Download', description: 'Click "Rotate PDF" and download the rotated document. The rotation is permanently saved in the PDF file, so it will display correctly in any PDF viewer.' },
    ],
    whyUseThis: [
        { title: 'Permanent Rotation', description: 'Unlike the temporary "View > Rotate" option in PDF readers, SababPDF saves the rotation permanently into the PDF file. The pages will display correctly for everyone who opens the document.' },
        { title: 'Fix Scanned Documents', description: 'Commonly needed for scanned documents that were fed into the scanner sideways or upside down. Quickly correct the orientation so the document reads naturally.' },
        { title: 'Three Rotation Options', description: 'Rotate pages 90° clockwise, 90° counter-clockwise, or flip 180°. These three options cover every orientation correction you might need.' },
        { title: 'Browser-Based & Private', description: 'All rotation processing happens locally in your browser. Your document is never uploaded to any server, keeping your content completely private and secure.' },
    ],
    tips: [
        'For scanned documents that appear sideways, use Right 90° or Left 90° depending on which direction the page needs to turn to become upright.',
        'If a document appears upside down (text reads from bottom to top), use the 180° rotation to flip it completely.',
        'The rotation applies to all pages in the PDF. If you need to rotate only specific pages, split the PDF first, rotate the individual pages, then merge them back together.',
        'After rotating, verify the result by downloading and opening the PDF to confirm all pages are oriented correctly.',
        'Rotation does not change the content, resolution, or quality of your document. It only changes the display orientation.',
    ],
    faqs: [
        { question: 'Does rotation affect all pages or just one?', answer: 'The rotation is applied to all pages in the PDF document. If you need to rotate only specific pages, use our Split PDF tool to extract those pages, rotate them, then use Merge PDF to combine everything back together.' },
        { question: 'Is the rotation permanent?', answer: 'Yes! Unlike the "rotate view" option in some PDF readers (which only changes how you see it temporarily), SababPDF modifies the actual PDF file so the rotation is saved permanently. Everyone who opens the file will see the corrected orientation.' },
        { question: 'Will rotating reduce the quality of my PDF?', answer: 'No. Rotation is a lossless operation. The content, text, images, and formatting of your PDF remain completely unchanged. Only the display orientation of the pages is modified.' },
        { question: 'Can I rotate a password-protected PDF?', answer: 'You will need to unlock the PDF first using our Unlock PDF tool. Once unlocked, you can rotate the pages and then re-protect the file if needed using our Protect PDF tool.' },
        { question: 'What is the difference between Right 90°, Left 90°, and 180°?', answer: 'Right 90° rotates the page clockwise (like turning a book to the right). Left 90° rotates counter-clockwise. 180° flips the page completely upside down. Most scanned document fixes need either Right or Left 90°.' },
    ],
    relatedTools: [
        { name: 'Crop PDF', href: '/crop-pdf', icon: '✂️' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Add Page Numbers', href: '/add-page-numbers', icon: '🔢' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
        { name: 'Repair PDF', href: '/repair-pdf', icon: '🛠️' },
    ],
};

const RotatePdf = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [rotation, setRotation] = useState(90); // Default rotation

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
            const pdfBlob = await rotatePdf(file, rotation);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error rotating PDF:', error);
            alert('Failed to rotate PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <RotateCw className="h-8 w-8 text-indigo-600" />
                        Rotate PDF
                    </h1>
                    <p className="text-gray-600">
                        Rotate your PDF pages permanently.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-indigo-100 p-2 rounded">
                                        <File className="h-6 w-6 text-indigo-600" />
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

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setRotation(90)}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${rotation === 90 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                                >
                                    <RotateCw className="h-8 w-8 mb-2" />
                                    <span className="font-medium">Right 90°</span>
                                </button>
                                <button
                                    onClick={() => setRotation(-90)}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${rotation === -90 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                                >
                                    <RotateCcw className="h-8 w-8 mb-2" />
                                    <span className="font-medium">Left 90°</span>
                                </button>
                                <button
                                    onClick={() => setRotation(180)}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${rotation === 180 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                                >
                                    <RefreshCcw className="h-8 w-8 mb-2" />
                                    <span className="font-medium">180°</span>
                                </button>
                            </div>

                            <div className="flex justify-center">
                                {downloadUrl ? (
                                    <div className="text-center space-y-4">
                                        <a
                                            href={downloadUrl}
                                            download={`rotated_${file.name}`}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download Rotated PDF
                                        </a>
                                        <button
                                            onClick={() => setDownloadUrl(null)}
                                            className="block mx-auto text-sm text-gray-500 hover:text-gray-700 underline"
                                        >
                                            Rotate another way
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? 'Rotating...' : 'Rotate PDF'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Rotate PDF Pages"
                howToUse={rotatePdfContent.howToUse}
                whyUseThis={rotatePdfContent.whyUseThis}
                tips={rotatePdfContent.tips}
                faqs={rotatePdfContent.faqs}
                relatedTools={rotatePdfContent.relatedTools}
            />
        </div>
    );
};

export default RotatePdf;
