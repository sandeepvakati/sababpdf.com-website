'use client';

import Link from 'next/link';
import UnifiedToolWrapper from '../../components/UnifiedToolWrapper';
import ToolWorkspace from '../../components/ToolWorkspace';
import WordToPdfILovePDF from '../../components/WordToPdfILovePDF';
import ExtractPages from './ExtractPages';
import ReorderPages from './ReorderPages';
import HtmlToPdfILovePDF from '../../components/HtmlToPdfILovePDF';
import AddWatermarkILovePDF from '../../components/AddWatermarkILovePDF';
import AddPages from './AddPages';
import ScanToPdfILovePDF from '../../components/ScanToPdfILovePDF';
import PdfToJpgILovePDF from '../../components/PdfToJpgILovePDF';
import EditPdfILovePDF from '../../components/EditPdfILovePDF';
import UnlockPdfILovePDF from '../../components/UnlockPdfILovePDF';
import ProtectPdfILovePDF from '../../components/ProtectPdfILovePDF';
import SignPdfILovePDF from '../../components/SignPdfILovePDF';
import RedactPdfILovePDF from '../../components/RedactPdfILovePDF';
function buildGuide(tool) {
  const sharedSteps = [
    'Upload the source file in the workspace section.',
    'Choose the pages or settings that match your task.',
    'Start processing, then use the download button when the result is ready.',
  ];

  const toolSteps = {
    'merge-pdf': [
      'Add two or more PDFs in the order you want them combined.',
      'Review the file list and remove anything that should not be included.',
      'Start the merge, then click the download button for the final merged document.',
    ],
    'split-pdf': [
      'Upload one PDF file.',
      'Choose either page groups or one output file per page.',
      'Download the ZIP that contains the split PDFs.',
    ],
    'compress-pdf': [
      'Upload one PDF file.',
      'Run the compression step.',
      'Download the lighter PDF and compare the new size before publishing.',
    ],
    'rotate-pdf': [
      'Upload one PDF file.',
      'Choose the angle that fixes the page orientation.',
      'Download the corrected PDF.',
    ],
    'delete-pages': [
      'Upload one PDF file.',
      'Enter the pages you want to remove, for example 2,4-6.',
      'Download the cleaned PDF with the unwanted pages removed.',
    ],
    'extract-pages': [
      'Upload one PDF file.',
      'Enter the page numbers or ranges you want to extract (e.g., 1-3, 5, 7-9).',
      'Click Extract Pages and download your new PDF with selected pages.',
    ],
    'reorder-pages': [
      'Upload one PDF file.',
      'Drag and drop page thumbnails to rearrange them into the order you want.',
      'Click Reorder Pages and download your PDF in the new sequence.',
    ],
    'jpg-to-pdf': [
      'Upload one or more image files.',
      'Keep the files in the order you want them added to the document.',
      'Download a single PDF built from those images.',
    ],
    'svg-to-jpg': [
      'Upload one SVG image file.',
      'Start the conversion and keep the browser tab open for a moment.',
      'Download the JPG image generated from the SVG artwork.',
    ],
    'pdf-to-word': [
      'Upload one PDF file and confirm the detected page count in the workspace.',
      'Choose No OCR for selectable-text PDFs, OCR for scanned PDFs with non-selectable text, or Keep PDF layout for a closer visual match. No OCR now uses the stronger editable converter first.',
      'Start the conversion, wait for the DOCX to finish processing, then use the download button.',
    ],
    'pdf-to-jpg': [
      'Upload one PDF file.',
      'Click Convert to JPG and wait for the pages to be extracted.',
      'Download each page image individually, or download all images at once.',
    ],
    'watermark-pdf': [
      'Upload one PDF file.',
      'Enter the watermark text you want added across each page.',
      'Download the watermarked version.',
    ],
    'add-page-numbers': [
      'Upload one PDF file.',
      'Choose the page-number position and optional prefix or suffix.',
      'Download the numbered PDF.',
    ],
    'add-pages': [
      'Upload the base PDF you want to add pages to.',
      'Add one or more PDF files whose pages you want to insert.',
      'Choose the insert position (beginning, end, or after a specific page) and download.',
    ],
    'scan-to-pdf': [
      'Open your camera or upload photos of documents you want to scan.',
      'Adjust brightness, contrast, and grayscale to enhance the scanned look.',
      'Click Create PDF to generate a downloadable PDF from all scanned pages.',
    ],
  };

  const notes = [
    'Browser-side tools keep files in the current session and do not send them to your server.',
    'Server-side conversion tools depend on your backend service and supporting system packages.',
    'For public launch, hide or disable any route whose backend is not configured yet.',
  ];

  const faq = [
    {
      question: `Is ${tool.title} free to use?`,
      answer:
        'Yes! SababPDF is completely free to use. No login required, no hidden charges. Just upload, process, and download.',
    },
    {
      question: 'Are uploaded files stored permanently?',
      answer:
        'No. Browser-side tools operate entirely in your browser tab. For server-side conversions, files are automatically deleted after processing.',
    },
    {
      question: 'Do I need to create an account?',
      answer:
        'No account or login is needed. All tools are available instantly — just visit the page and start working with your files.',
    },
  ];

  return {
    steps: toolSteps[tool.id] || sharedSteps,
    notes,
    faq,
  };
}

/** SEO content section - Optimized for Google AdSense and User Experience */
function SeoContent({ tool, guide }) {
  return (
    <section className="mt-16 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700 font-sans">
      
      {/* How to Use Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-red-100 text-red-600 p-2 rounded-lg mr-3 text-sm">💡</span>
          How to use {tool.title}
        </h2>
        <ol className="list-decimal list-inside space-y-4 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {guide.steps.map((step) => (
            <li key={step} className="text-lg text-gray-700 pl-2 leading-relaxed">{step}</li>
          ))}
        </ol>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 text-sm">❓</span>
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {guide.faq.map((entry) => (
            <article key={entry.question} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 mb-3">{entry.question}</h3>
              <p className="text-gray-600 leading-relaxed">{entry.answer}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Why Use SababPDF Section */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl border border-red-100 shadow-sm">
        <h2 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
          <span className="bg-white text-red-600 p-2 rounded-lg mr-3 text-sm shadow-sm">🚀</span>
          Why use SababPDF?
        </h2>
        <p className="text-red-800 leading-relaxed text-lg">
          SababPDF is built for speed, premium quality, and complete security. Our {tool.title} tool processes your files securely, ensuring your private data remains 100% confidential. You don't need to create an account, download software, or pay expensive subscription fees—just a fast, seamless experience directly in your browser. All uploaded files are automatically and permanently deleted from our servers after processing, guaranteeing your complete privacy.
        </p>
      </div>

    </section>
  );
}

export default function ToolPageClient({ tool }) {
  const guide = buildGuide(tool);

  // ----- Extract Pages -----
  if (tool.id === 'extract-pages') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <ExtractPages embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Reorder Pages -----
  if (tool.id === 'reorder-pages') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <ReorderPages embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Word to PDF -----
  if (tool.id === 'word-to-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <WordToPdfILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- HTML to PDF -----
  if (tool.id === 'html-to-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <HtmlToPdfILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Add Watermark -----
  if (tool.id === 'watermark-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <AddWatermarkILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Edit PDF -----
  if (tool.id === 'edit-pdf') {
    return (
      <>
        <EditPdfILovePDF />
        <SeoContent tool={tool} guide={guide} />
      </>
    );
  }

  // ----- Add Pages -----
  if (tool.id === 'add-pages') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <AddPages embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Scan to PDF -----
  if (tool.id === 'scan-to-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <ScanToPdfILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- PDF to JPG -----
  if (tool.id === 'pdf-to-jpg') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <PdfToJpgILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Unlock PDF -----
  if (tool.id === 'unlock-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <UnlockPdfILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Protect PDF -----
  if (tool.id === 'protect-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <ProtectPdfILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Sign PDF -----
  if (tool.id === 'sign-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <SignPdfILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- Redact PDF -----
  if (tool.id === 'redact-pdf') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <RedactPdfILovePDF embedded />
        <SeoContent tool={tool} guide={guide} />
      </UnifiedToolWrapper>
    );
  }

  // ----- ALL OTHER TOOLS -----
  return (
    <UnifiedToolWrapper tool={tool}>
      <ToolWorkspace tool={tool} />
      <SeoContent tool={tool} guide={guide} />
    </UnifiedToolWrapper>
  );
}
