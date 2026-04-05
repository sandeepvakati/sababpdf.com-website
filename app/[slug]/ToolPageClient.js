'use client';

import Link from 'next/link';
import UnifiedToolWrapper from '../../components/UnifiedToolWrapper';
import ToolWorkspace from '../../components/ToolWorkspace';
import PdfToWordILovePDF from '../../components/PdfToWordILovePDF';
import WordToPdfILovePDF from '../../components/WordToPdfILovePDF';
import ExtractPages from './ExtractPages';

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
      'Enter the full page order, for example 3,1,2.',
      'Download the PDF in the new sequence.',
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
      'Start the export job.',
      'Download the ZIP file that contains one JPG image per page.',
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

/** SEO content section - hidden for visual but available for search engines */
function SeoContent({ tool, guide }) {
  return (
    <section className="seo-content-section" style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: '0' }}>
      <div className="content-grid">
        <section className="article-card">
          <h2>{tool.title} workflow</h2>
          <ol>
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
      <section className="section-block">
        <div className="article-grid">
          {guide.faq.map((entry) => (
            <article key={entry.question}>
              <h3>{entry.question}</h3>
              <p>{entry.answer}</p>
            </article>
          ))}
        </div>
      </section>
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

  // ----- PDF to Word -----
  if (tool.id === 'pdf-to-word') {
    return (
      <UnifiedToolWrapper tool={tool}>
        <PdfToWordILovePDF embedded />
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

  // ----- ALL OTHER TOOLS -----
  return (
    <UnifiedToolWrapper tool={tool}>
      <ToolWorkspace tool={tool} />
      <SeoContent tool={tool} guide={guide} />
    </UnifiedToolWrapper>
  );
}
