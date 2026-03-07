'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertImageToPdf } from '@/utils/conversionUtils';
import { Image, Download, File, Trash2, Plus } from 'lucide-react';

const jpgToPdfContent = {
    howToUse: [
        { title: 'Upload Your Images', description: 'Click the upload area or drag and drop your JPG, JPEG, or PNG images. You can select multiple images at once. Each image will be shown as a preview so you can verify you have the right files.' },
        { title: 'Review and Organize', description: 'Check the image previews to make sure all your photos are included. You can remove any unwanted images by clicking the trash icon on each thumbnail. The images will appear in the PDF in the order shown.' },
        { title: 'Convert and Download', description: 'Click "Convert to PDF" and SababPDF will combine all your images into a single, well-formatted PDF document. Download the result instantly — perfect for creating photo albums, portfolios, or document scans.' },
    ],
    whyUseThis: [
        { title: 'Multiple Images, One PDF', description: 'Combine dozens of JPG photos into a single PDF document. Perfect for creating portfolios, photo albums, scanned document collections, or submission packages that need to be one file.' },
        { title: 'High Quality Output', description: 'SababPDF embeds your images at their original resolution inside the PDF. Your photos will not be down-scaled or lose quality during the conversion process.' },
        { title: 'Supports JPG & PNG', description: 'Upload JPG, JPEG, or PNG images. Both formats are supported and can even be mixed in a single conversion — combine photos and screenshots together in one PDF.' },
        { title: 'Fast & Private', description: 'All image-to-PDF conversion happens in your browser. Your photos are never uploaded to any server, making it safe for personal photos, identity documents, and confidential materials.' },
    ],
    tips: [
        'For scanned documents, make sure your photos are well-lit and cropped before converting to ensure the best readability in the PDF.',
        'Upload images in the order you want them to appear in the PDF. The first image uploaded becomes the first page.',
        'If you need to reduce the final PDF size, use our Compress PDF tool after conversion to shrink the file significantly.',
        'For best results with document scans, use high-resolution images (at least 300 DPI) to ensure text is clear and readable.',
        'You can add more images even after the initial upload by clicking the upload area again to append additional files.',
    ],
    faqs: [
        { question: 'How many images can I convert at once?', answer: 'There is no strict limit on the number of images. You can convert as many as your browser can handle. For very large batches (100+ high-resolution photos), the process may take a bit longer depending on your device.' },
        { question: 'What image formats are supported?', answer: 'SababPDF supports JPG, JPEG, and PNG image formats. These cover the vast majority of photos and screenshots. SVG, GIF, and other formats are not currently supported.' },
        { question: 'Does converting images to PDF reduce quality?', answer: 'No. Your images are embedded in the PDF at their original resolution and quality. The PDF simply acts as a container for your images, preserving them exactly as they are.' },
        { question: 'Can I control the page size of the PDF?', answer: 'Currently, each page in the PDF is sized to match the dimensions of the corresponding image. This means portrait photos become portrait pages and landscape photos become landscape pages, ensuring optimal display.' },
        { question: 'Can I add text or captions to the photos?', answer: 'This tool converts images directly to PDF without adding text. If you need to add captions or annotations, consider using our Add Watermark tool on the resulting PDF, or edit the images in a photo editor before converting.' },
    ],
    relatedTools: [
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Add Page Numbers', href: '/add-page-numbers', icon: '🔢' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'Scan to PDF', href: '/scan-to-pdf', icon: '📱' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
    ],
};

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
                                        {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Converting...
                                        </span>
                                    ) : (
                                        'Convert to PDF'
                                    )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Convert JPG to PDF"
                howToUse={jpgToPdfContent.howToUse}
                whyUseThis={jpgToPdfContent.whyUseThis}
                tips={jpgToPdfContent.tips}
                faqs={jpgToPdfContent.faqs}
                relatedTools={jpgToPdfContent.relatedTools}
            />
        </div>
    );
};

export default JpgToPdf;
