import FeatureCard from '../components/FeatureCard';
import {
    Layers, Scissors, Minimize2, FileText, FileSpreadsheet, Image,
    FileImage, Presentation, RotateCw, Hash, Stamp, Lock, Unlock,
    FileBadge, Crop, ArrowRightLeft, Scan, Camera, Wrench, Globe
} from 'lucide-react';

const tools = [
    {
        title: 'Merge PDF',
        description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
        icon: Layers,
        to: '/merge-pdf',
        color: 'bg-red-500',
    },
    {
        title: 'Split PDF',
        description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
        icon: Scissors,
        to: '/split-pdf',
        color: 'bg-green-500',
    },
    {
        title: 'Compress PDF',
        description: 'Reduce file size while optimizing for maximal PDF quality.',
        icon: Minimize2,
        to: '/compress-pdf',
        color: 'bg-blue-500',
    },
    {
        title: 'Repair PDF',
        description: 'Recover data from a corrupted or damaged PDF file.',
        icon: Wrench,
        to: '/repair-pdf',
        color: 'bg-gray-500',
    },
    {
        title: 'Add Watermark',
        description: 'Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.',
        icon: Stamp,
        to: '/add-watermark',
        color: 'bg-purple-600',
    },
    {
        title: 'PDF to PDF/A',
        description: 'Convert PDF documents to PDF/A for archiving and long-term preservation.',
        icon: FileBadge, // I need to import FileBadge
        to: '/pdf-to-pdfa',
        color: 'bg-indigo-500',
    },
    {
        title: 'Crop PDF',
        description: 'Trim the margins of your PDF pages.',
        icon: Crop, // Need import
        to: '/crop-pdf',
        color: 'bg-orange-500',
    },
    {
        title: 'HTML to PDF',
        description: 'Convert webpages in HTML to PDF.',
        icon: Globe,
        to: '/html-to-pdf',
        color: 'bg-blue-600',
    },
    {
        title: 'Word to PDF',
        description: 'Convert your DOC and DOCX files to PDF instantly.',
        icon: FileText,
        to: '/word-to-pdf',
        color: 'bg-blue-600',
    },
    {
        title: 'PDF to Word',
        description: 'Convert your PDF files to editable DOCX documents.',
        icon: FileText,
        to: '/pdf-to-word',
        color: 'bg-blue-600',
    },
    {
        title: 'Excel to PDF',
        description: 'Convert your Excel spreadsheets to PDF instantly.',
        icon: FileSpreadsheet,
        to: '/excel-to-pdf',
        color: 'bg-green-600',
    },
    {
        title: 'PowerPoint to PDF',
        description: 'Convert your PowerPoint presentations to PDF.',
        icon: Presentation,
        to: '/powerpoint-to-pdf',
        color: 'bg-orange-600',
    },
    {
        title: 'PDF to Excel',
        description: 'Convert your PDF files to editable Excel spreadsheets.',
        icon: FileSpreadsheet,
        to: '/pdf-to-excel',
        color: 'bg-green-600',
    },
    {
        title: 'JPG to PDF',
        description: 'Convert valid JPG images to PDF documents.',
        icon: Image,
        to: '/jpg-to-pdf',
        color: 'bg-yellow-500',
    },
    {
        title: 'PDF to JPG',
        description: 'Extract PDF pages as JPG images or convert single pages.',
        icon: FileImage,
        to: '/pdf-to-jpg',
        color: 'bg-yellow-500',
    },
    {
        title: 'PDF to PowerPoint',
        description: 'Convert your PDF files to editable PowerPoint presentations.',
        icon: Presentation,
        to: '/pdf-to-powerpoint',
        color: 'bg-orange-600',
    },
    {
        title: 'Rotate PDF',
        description: 'Rotate your PDF pages permanently.',
        icon: RotateCw,
        to: '/rotate-pdf',
        color: 'bg-indigo-600',
    },
    {
        title: 'Add Page Numbers',
        description: 'Add page numbers to your PDF document with ease.',
        icon: Hash,
        to: '/add-page-numbers',
        color: 'bg-pink-600',
    },
    {
        title: 'Add Watermark',
        description: 'Stamp your PDF with a text watermark.',
        icon: Stamp,
        to: '/add-watermark',
        color: 'bg-purple-600',
    },
    {
        title: 'Redact PDF',
        description: 'Permanently remove sensitive information from your PDFs.',
        icon: FileBadge, // Using FileBadge generic or maybe EyeOff if available? I'll use FileBadge for now or check imports.
        to: '/redact-pdf',
        color: 'bg-gray-800',
    },
    {
        title: 'Protect PDF',
        description: 'Encrypt your PDF with a password.',
        icon: Lock,
        to: '/protect-pdf',
        color: 'bg-emerald-600',
    },

    {
        title: 'Scan to PDF',
        description: 'Capture document scans from your mobile device and send them instantly to your browser.',
        icon: Camera,
        to: '/scan-pdf',
        color: 'bg-orange-500',
    },
    {
        title: 'Compare PDF',
        description: 'Show two PDF documents side by side to see the unexpected changes.',
        icon: ArrowRightLeft,
        to: '/compare-pdf',
        color: 'bg-pink-500',
    },
    {
        title: 'Unlock PDF',
        description: 'Remove password and restrictions from your PDF.',
        icon: Unlock,
        to: '/unlock-pdf',
        color: 'bg-cyan-600',
    },
];

const Home = () => {
    return (
        <div className="bg-gray-50 py-16 flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        Every tool you need to work with PDFs in one place
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
                        Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {tools.map((tool) => (
                        <FeatureCard key={tool.title} {...tool} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
