'use client';
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import ToolPageContent from '@/components/ToolPageContent';
import { convertPdfToPpt } from '@/utils/conversionUtils';
import { Presentation, Download, File, Trash2 } from 'lucide-react';

const pdfToPowerPointContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the upload area or drag and drop your PDF file. SababPDF accepts any standard PDF document for conversion to PowerPoint format.' },
        { title: 'Convert to PowerPoint', description: 'Click "Convert to PowerPoint" and SababPDF will process each page of your PDF, converting it into individual PowerPoint slides. The conversion preserves the visual layout of each page.' },
        { title: 'Download PPTX File', description: 'Once conversion is complete, download your PowerPoint file (.pptx). Open it in Microsoft PowerPoint, Google Slides, or any compatible presentation software and start editing.' },
    ],
    whyUseThis: [
        { title: 'Repurpose PDF Content', description: 'Transform static PDF documents into editable PowerPoint presentations. Perfect for converting reports, proposals, and handouts into presentation-ready slideshows.' },
        { title: 'Preserve Visual Layout', description: 'Each PDF page is converted into a PowerPoint slide, maintaining the original visual layout. This ensures your content looks the same in the presentation as it did in the PDF.' },
        { title: 'Universal Compatibility', description: 'The output .pptx file works in Microsoft PowerPoint, Google Slides, LibreOffice Impress, Keynote, and all other major presentation tools.' },
        { title: 'Free & Private', description: 'Convert as many PDFs as you need without any cost or registration. All processing happens in your browser — your files are never uploaded to any server.' },
    ],
    tips: [
        'For best results, use PDFs that have a landscape orientation, as this matches the typical PowerPoint slide layout.',
        'After conversion, you can edit the slides in PowerPoint to add animations, transitions, and speaker notes.',
        'If your PDF has many pages, the conversion may take a few moments. Be patient while the tool processes each page.',
        'The converted slides preserve the visual layout but may not retain editable text. Consider using our PDF to Word tool if you primarily need to extract and edit text.',
        'For multi-page reports, consider splitting the PDF first to convert only the pages you need for your presentation.',
    ],
    faqs: [
        { question: 'Will the text be editable in PowerPoint?', answer: 'The conversion preserves the visual layout of each PDF page as a slide. Depending on the PDF structure, some text may be editable while other content may be rendered as images. For fully editable text, consider our PDF to Word conversion tool instead.' },
        { question: 'What happens to images and charts in the PDF?', answer: 'Images, charts, and visual elements from the PDF are preserved in the PowerPoint slides. They maintain their original appearance and positioning within each slide.' },
        { question: 'Is there a page limit for conversion?', answer: 'There is no strict page limit. However, since processing happens in your browser, very large PDFs (hundreds of pages) may take longer to convert. For very long documents, consider splitting the PDF first.' },
        { question: 'Can I edit the slides after conversion?', answer: 'Yes! The output is a standard .pptx file that you can open and edit in any presentation software. You can modify text, add new slides, apply themes, add animations, and make any changes you need.' },
        { question: 'Does this work with scanned PDFs?', answer: 'Yes. Scanned PDF pages will be converted to slides as images. While the visual content is preserved, scanned text will not be editable — it will appear as an image within the slide.' },
    ],
    relatedTools: [
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'PDF to JPG', href: '/pdf-to-jpg', icon: '🖼️' },
        { name: 'PDF to Excel', href: '/pdf-to-excel', icon: '📊' },
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Split PDF', href: '/split-pdf', icon: '✂️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
    ],
};

const PdfToPowerPoint = () => {
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

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const pptBlob = await convertPdfToPpt(file);
            const url = URL.createObjectURL(pptBlob);
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting PDF to PowerPoint:', error);
            alert('Failed to convert PDF file. Please try a different document.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Presentation className="h-8 w-8 text-orange-600" />
                        PDF to PowerPoint
                    </h1>
                    <p className="text-gray-600">
                        Convert your PDF files to editable PowerPoint presentations.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {!file ? (
                        <FileUploader onFilesSelected={handleFileSelected} multiple={false} accept=".pdf" />
                    ) : (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-orange-100 p-2 rounded">
                                        <File className="h-6 w-6 text-orange-600" />
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
                                        <a
                                            href={downloadUrl}
                                            download={`${file.name.replace(/\.[^/.]+$/, "")}.pptx`}
                                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Download className="h-5 w-5" />
                                            Download PowerPoint
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                                    ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Converting...
                                        </span>
                                    ) : (
                                        'Convert to PowerPoint'
                                    )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToolPageContent
                title="Convert PDF to PowerPoint"
                howToUse={pdfToPowerPointContent.howToUse}
                whyUseThis={pdfToPowerPointContent.whyUseThis}
                tips={pdfToPowerPointContent.tips}
                faqs={pdfToPowerPointContent.faqs}
                relatedTools={pdfToPowerPointContent.relatedTools}
            />
        </div>
    );
};

export default PdfToPowerPoint;
