'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, FileText, Shield, Zap, HelpCircle } from 'lucide-react';

const faqCategories = [
    {
        name: 'General',
        icon: HelpCircle,
        faqs: [
            { question: 'What is SababPDF?', answer: 'SababPDF is a free online platform offering 20+ PDF tools including merging, splitting, compressing, converting, protecting, and editing PDFs. All tools work directly in your browser with no software installation required.' },
            { question: 'Is SababPDF really free?', answer: 'Yes, all our core PDF tools are completely free to use. There are no hidden costs, no daily usage limits, and no forced account creation. You can process as many files as you need.' },
            { question: 'Do I need to create an account?', answer: 'No. SababPDF does not require registration, login, or any account creation. Simply visit the tool you need, upload your file, process it, and download the result.' },
            { question: 'What devices and browsers are supported?', answer: 'SababPDF works on any device with a modern web browser. This includes Windows, Mac, Linux, iOS, Android, and Chromebook. We support Chrome, Firefox, Safari, Edge, and most other modern browsers.' },
            { question: 'Can I use SababPDF on my phone?', answer: 'Yes! SababPDF is fully responsive and works on smartphones and tablets. You can merge, split, compress, and convert PDFs directly from your mobile browser.' },
        ]
    },
    {
        name: 'Privacy & Security',
        icon: Shield,
        faqs: [
            { question: 'Are my files uploaded to your servers?', answer: 'No. SababPDF processes all files entirely in your web browser using JavaScript. Your documents never leave your device. We do not upload, store, transmit, or access your files in any way.' },
            { question: 'How is my data protected?', answer: 'Since all processing happens locally in your browser, your data is protected by design. There is no server-side processing, no cloud storage, and no data transfer. Your files remain on your device throughout the entire process.' },
            { question: 'Can SababPDF see the content of my PDFs?', answer: 'No. We cannot see, read, or access the content of your PDFs because they are never uploaded to our servers. The processing happens entirely within your browser, which means only your device handles the file.' },
            { question: 'Is it safe to process confidential documents?', answer: 'Yes. Because SababPDF processes files locally in your browser without any server uploads, it is safe to use for confidential documents, contracts, financial records, medical documents, and other sensitive materials.' },
            { question: 'Do you store any files after processing?', answer: 'No. We do not store any files. Since processing happens in your browser, there is nothing stored on our end. When you close the browser tab, all processed data is cleared from memory.' },
        ]
    },
    {
        name: 'Tools & Features',
        icon: FileText,
        faqs: [
            { question: 'What PDF tools does SababPDF offer?', answer: 'SababPDF offers over 20 tools including: Merge PDF, Split PDF, Compress PDF, PDF to Word, Word to PDF, JPG to PDF, PDF to JPG, Excel to PDF, PDF to Excel, PDF to PowerPoint, Protect PDF, Unlock PDF, Rotate PDF, Add Watermark, Add Page Numbers, Crop PDF, HTML to PDF, PDF to PDF/A, Repair PDF, Compare PDF, Redact PDF, Scan to PDF, and Signature Compressor.' },
            { question: 'Is there a file size limit?', answer: 'Since processing happens in your browser, the limit depends on your device\'s available memory. Most modern devices can handle PDFs up to 100MB without issues. For very large files, you may need to split them first.' },
            { question: 'What file formats can I convert to and from PDF?', answer: 'SababPDF supports conversion between PDF and several formats including Word (.docx), Excel (.xlsx), PowerPoint (.pptx), JPG/JPEG, PNG, and HTML. We are continuously adding support for more formats.' },
            { question: 'Can I merge more than two PDFs at once?', answer: 'Yes! The Merge PDF tool allows you to combine as many PDF files as you want. Simply upload all the files you want to merge, arrange them in your preferred order, and click merge.' },
            { question: 'Can I protect a PDF with a password?', answer: 'Yes. The Protect PDF tool lets you add password protection to any PDF file. You set a password, and anyone who wants to open the PDF will need to enter that password first.' },
            { question: 'What is the Compare PDF tool?', answer: 'The Compare PDF tool lets you upload two PDF files and view them side by side or overlaid on top of each other. This makes it easy to spot differences between two versions of the same document.' },
            { question: 'What is PDF/A and why would I convert to it?', answer: 'PDF/A is an archival format designed for long-term document preservation. It embeds all fonts and removes features like JavaScript that might not work in the future. Use it when you need to archive documents for compliance or long-term storage.' },
        ]
    },
    {
        name: 'Performance',
        icon: Zap,
        faqs: [
            { question: 'How fast is the processing?', answer: 'Most operations complete in just a few seconds. Merge, split, rotate, and compress operations are nearly instant for typical documents. Larger files or complex conversions may take a bit longer, depending on your device\'s processing power.' },
            { question: 'Why is processing slow on my device?', answer: 'Since SababPDF processes files in your browser, performance depends on your device\'s CPU and available memory. Older devices or devices with limited RAM may process large files more slowly. Try closing other browser tabs to free up resources.' },
            { question: 'Does SababPDF work offline?', answer: 'You need an internet connection to load the SababPDF website. However, once the page is loaded, the actual file processing happens locally in your browser and does not require active internet connectivity.' },
            { question: 'Can I process multiple files simultaneously?', answer: 'Some tools like Merge PDF and JPG to PDF support uploading and processing multiple files at once. For other tools that work on a single file, you can open multiple browser tabs to process files in parallel.' },
        ]
    },
];

const FAQItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-all hover:border-purple-200">
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
        >
            <span className="font-semibold text-gray-900 pr-4">{question}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                <p className="text-gray-700 leading-relaxed">{answer}</p>
            </div>
        )}
    </div>
);

const FAQ = () => {
    const [openItems, setOpenItems] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (categoryIndex, faqIndex) => {
        const key = `${categoryIndex}-${faqIndex}`;
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredCategories = faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.faqs.length > 0);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                        Everything you need to know about SababPDF and our free online PDF tools.
                    </p>
                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* FAQ Categories */}
                {filteredCategories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <category.icon className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                        </div>
                        <div className="space-y-3">
                            {category.faqs.map((faq, faqIndex) => {
                                const originalCategoryIndex = faqCategories.findIndex(c => c.name === category.name);
                                const key = `${originalCategoryIndex}-${faqIndex}`;
                                return (
                                    <FAQItem
                                        key={faqIndex}
                                        question={faq.question}
                                        answer={faq.answer}
                                        isOpen={!!openItems[key]}
                                        onClick={() => toggleItem(originalCategoryIndex, faqIndex)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="text-center py-12">
                        <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">No questions match your search.</p>
                        <button onClick={() => setSearchQuery('')} className="mt-4 text-purple-600 font-semibold hover:underline">
                            Clear search
                        </button>
                    </div>
                )}

                {/* Still Have Questions CTA */}
                <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
                    <p className="text-lg mb-8 opacity-90 max-w-xl mx-auto">
                        We are happy to help. Reach out to our team and we will get back to you as soon as possible.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="mailto:sababpdf@gmail.com" className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                            Email Us
                        </a>
                        <Link href="/contact" className="inline-block bg-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-400 transition-colors border border-purple-400">
                            Contact Form
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
