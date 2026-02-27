'use client';
import React, { useState } from 'react';
import { FileBadge, ArrowRight, Download, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import ToolPageContent from '@/components/ToolPageContent';
import { convertToPdfA } from '@/utils/conversionUtils';

const pdfToPdfAContent = {
    howToUse: [
        { title: 'Upload Your PDF', description: 'Click the file input and select the PDF document you want to convert to PDF/A format. The tool accepts any standard PDF file.' },
        { title: 'Start Conversion', description: 'Click "Convert to PDF/A" and SababPDF will process your document. The tool flattens interactive forms, sets PDF/A metadata fields, and establishes proper creation and modification dates for archival compliance.' },
        { title: 'Download Your PDF/A File', description: 'Once conversion is complete, download your PDF/A document. The file is now optimized for long-term digital preservation and archival storage according to PDF/A standards.' },
    ],
    whyUseThis: [
        { title: 'Long-Term Document Preservation', description: 'PDF/A is the international standard (ISO 19005) for digital document archiving. Converting to PDF/A ensures your documents can be accurately reproduced and viewed for decades to come, regardless of future software changes.' },
        { title: 'Regulatory Compliance', description: 'Many industries and government agencies require documents in PDF/A format for legal records, medical files, financial reports, and official submissions. This tool helps you meet those requirements easily.' },
        { title: 'Self-Contained Documents', description: 'PDF/A files embed all necessary resources (fonts, color profiles) within the document itself. This eliminates dependency on external resources and ensures the document looks the same on any system.' },
        { title: 'Browser-Based Processing', description: 'Convert your documents to PDF/A directly in your browser without installing specialized archival software. No need for expensive enterprise solutions — SababPDF handles it for free.' },
    ],
    tips: [
        'PDF/A conversion works best with text-based PDFs that use standard fonts. Documents with custom or proprietary fonts may have limited compliance.',
        'For the most reliable archival results, start with a clean, well-formatted source document before converting to PDF.',
        'After conversion, use a PDF/A validator tool to verify compliance if strict Level A compliance is required for your use case.',
        'PDF/A files may be slightly larger than regular PDFs because they embed all fonts and resources. Use our Compress PDF tool afterward if file size is a concern.',
        'Interactive features like form fields, JavaScript, and external links are removed during PDF/A conversion. Save your original PDF if you need these features.',
    ],
    faqs: [
        { question: 'What is PDF/A?', answer: 'PDF/A is a specialized version of the PDF format designed for long-term archiving of digital documents. It is defined by international standard ISO 19005. PDF/A files are self-contained, meaning they embed all fonts, color profiles, and metadata needed to reproduce the document accurately in the future.' },
        { question: 'What is the difference between PDF and PDF/A?', answer: 'Regular PDFs can contain external references, JavaScript, encryption, and interactive features. PDF/A removes all of these to create a self-contained, static document that will look the same regardless of the software or hardware used to view it, even decades from now.' },
        { question: 'Does this tool provide full PDF/A Level A compliance?', answer: 'This tool provides best-effort PDF/A compliance by flattening forms, setting A-standard metadata, and establishing proper dates. Full Level A compliance requires rigorous validation of fonts and color profiles, which depends heavily on the source document quality.' },
        { question: 'Will my interactive form fields still work?', answer: 'No. PDF/A requires that all forms be flattened (converted to static content). This is intentional — archival documents should not change after being archived. Fill in all forms before converting to PDF/A if you need the data preserved.' },
        { question: 'Who needs PDF/A documents?', answer: 'PDF/A is commonly required by government agencies, legal firms, healthcare organizations, financial institutions, and any organization that needs to preserve documents for regulatory compliance or historical records. It is also recommended for personal archiving of important documents.' },
    ],
    relatedTools: [
        { name: 'Compress PDF', href: '/compress-pdf', icon: '🗜️' },
        { name: 'Merge PDF', href: '/merge-pdf', icon: '📑' },
        { name: 'Protect PDF', href: '/protect-pdf', icon: '🔒' },
        { name: 'PDF to Word', href: '/pdf-to-word', icon: '📝' },
        { name: 'Repair PDF', href: '/repair-pdf', icon: '🛠️' },
        { name: 'Add Watermark', href: '/add-watermark', icon: '🎨' },
        { name: 'Add Page Numbers', href: '/add-page-numbers', icon: '🔢' },
        { name: 'Rotate PDF', href: '/rotate-pdf', icon: '🔄' },
    ],
};

const PdfToPdfA = () => {
    const [file, setFile] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
                setFile(selectedFile);
                setError(null);
                setDownloadUrl(null);
            } else {
                setFile(null);
                setError('Please select a valid PDF file.');
            }
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsConverting(true);
        setError(null);

        try {
            const pdfBlob = await convertToPdfA(file);
            const url = URL.createObjectURL(pdfBlob);
            setDownloadUrl(url);
        } catch (err) {
            console.error(err);
            setError('An error occurred during conversion. Please try again.');
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="bg-gray-50 flex-grow py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF to PDF/A Converter</h1>
                    <p className="text-lg text-gray-600">
                        Convert your PDF documents to PDF/A format for long-term archiving.
                    </p>
                </div>

                <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload PDF File
                            </label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>

                        {file && !downloadUrl && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                                    <FileBadge className="h-8 w-8 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                    <FileBadge className="h-8 w-8 text-green-600" />
                                </div>
                                <button
                                    onClick={handleConvert}
                                    disabled={isConverting}
                                    className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isConverting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Converting...
                                        </>
                                    ) : (
                                        'Convert to PDF/A'
                                    )}
                                </button>
                            </div>
                        )}

                        {downloadUrl && (
                            <div className="text-center w-full bg-green-50 p-6 rounded-xl border border-green-200">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Conversion Complete!</h3>
                                <p className="text-sm text-gray-600 mb-6">Your PDF is now compatible with PDF/A standards (Best Effort).</p>
                                <a
                                    href={downloadUrl}
                                    download={`PDF_A_${file.name}`}
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                                >
                                    <Download className="h-5 w-5" />
                                    Download PDF/A
                                </a>
                                <button
                                    onClick={() => { setFile(null); setDownloadUrl(null); }}
                                    className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Convert another file
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 max-w-2xl mx-auto text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0" />
                        <div className="text-left">
                            <p className="font-semibold mb-1">About PDF/A Compliance:</p>
                            <p>
                                This tool enhances your PDF for long-term archiving by:
                            </p>
                            <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                <li>Flattening interactive forms (to ensure content doesn't change).</li>
                                <li>Setting specific PDF/A metadata fields.</li>
                                <li>Establishing creation and modification dates.</li>
                            </ul>
                            <p className="mt-2 text-xs opacity-80">
                                Note: Full "Level A" compliance requires rigorous validation of fonts and color profiles which depends heavily on the source document.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ToolPageContent
                title="Convert PDF to PDF/A for Archiving"
                howToUse={pdfToPdfAContent.howToUse}
                whyUseThis={pdfToPdfAContent.whyUseThis}
                tips={pdfToPdfAContent.tips}
                faqs={pdfToPdfAContent.faqs}
                relatedTools={pdfToPdfAContent.relatedTools}
            />
        </div>
    );
};

export default PdfToPdfA;
