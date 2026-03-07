'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertPdfToImages } from '@/utils/conversionUtils';
import { FileImage, Download, File, Trash2, Archive } from 'lucide-react';
import JSZip from 'jszip';

const pdfToJpgContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop your PDF file. SababPDF will read all pages from the document and prepare them for conversion to high-quality JPG images.' },
        { title: 'Convert All Pages', description: 'Click the "Convert to JPG" button. SababPDF renders each page of your PDF as a high-resolution JPG image. For single-page PDFs, you get one image. For multi-page PDFs, all images are automatically packaged into a ZIP file.' },
        { title: 'Download Your Images', description: 'For single-page PDFs, download the JPG directly. For multi-page PDFs, download a ZIP file containing all page images. Extract the ZIP to access individual JPG files for each page.' },
    ],
    whyUseThis: [
        { title: 'High-Resolution Output', description: 'Every PDF page is rendered as a high-quality JPG image with sharp text and clear graphics. The output is suitable for presentations, social media, printing, and web use.' },
        { title: 'Automatic ZIP Packaging', description: 'When converting multi-page PDFs, SababPDF automatically packages all images into a convenient ZIP file. No need to download pages one by one — get everything in a single click.' },
        { title: 'Universal Image Format', description: 'JPG images work everywhere — social media, messaging apps, presentations, websites, and print shops. Convert your PDF content into the world\'s most compatible image format.' },
        { title: 'Browser-Based Privacy', description: 'The entire conversion process happens in your browser. Your PDF pages are rendered locally and are never sent to any server, making it safe for confidential and sensitive documents.' },
    ],
    tips: [
        'For presentations, convert your PDF slides to JPG to easily embed them in PowerPoint, Google Slides, or social media posts.',
        'If you need only specific pages as images, split your PDF first using our Split PDF tool, then convert the extracted pages to JPG.',
        'The output JPG files are high resolution and may be large. Use an image compression tool if you need to reduce file sizes for web use.',
        'For scanned documents, converting PDF to JPG gives you individual page images that can be easily shared via messaging apps.',
        'If you need PNG format instead of JPG (for transparency support), the images can be converted using any standard image editor after download.',
    ],
    faqs: [
        { question: 'What quality are the output JPG images?', answer: 'SababPDF renders each PDF page at high resolution, producing clear and sharp JPG images. Text, graphics, and photos in the PDF are all accurately reproduced. The output quality is suitable for both screen viewing and printing.' },
        { question: 'Can I convert specific pages instead of the entire PDF?', answer: 'Currently, this tool converts all pages in the PDF. If you need only certain pages, use our Split PDF tool first to extract the pages you want, then convert the resulting smaller PDF to JPG.' },
        { question: 'How are multi-page PDFs handled?', answer: 'For single-page PDFs, you download one JPG image directly. For PDFs with two or more pages, all page images are automatically packaged into a ZIP file for convenient download.' },
        { question: 'Is the conversion lossless?', answer: 'JPG is a lossy image format, so there is a very slight quality reduction compared to the original PDF vector graphics. However, the difference is imperceptible for normal use. If you need pixel-perfect output, consider using PNG format instead.' },
        { question: 'Are my files safe during conversion?', answer: 'Yes. All conversion processing happens entirely in your browser using JavaScript. Your PDF file and the resulting JPG images never leave your device. No data is sent to any external server.' },
    ],
    relatedTools: [
        { name: 'JPG to PDF', href: '/jpg-to-pdf', icon: '🖼️' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Crop PDF', href: '/crop-pdf', icon: '✂️' },
        { name: 'PDF to Excel', href: '/pdf-to-excel', icon: '📊' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'PDF to PowerPoint', href: '/pdf-to-powerpoint', icon: '📊' },
    ],
};

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
                                        {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Converting...
                                        </span>
                                    ) : (
                                        'Convert to JPG'
                                    )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Convert PDF to JPG"
                howToUse={pdfToJpgContent.howToUse}
                whyUseThis={pdfToJpgContent.whyUseThis}
                tips={pdfToJpgContent.tips}
                faqs={pdfToJpgContent.faqs}
                relatedTools={pdfToJpgContent.relatedTools}
            />
        </div>
    );
};

export default PdfToJpg;
