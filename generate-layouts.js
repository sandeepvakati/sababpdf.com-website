const fs = require('fs');
const path = require('path');

const tools = [
    { dir: 'add-page-numbers', title: 'Add Page Numbers to PDF', desc: 'Add page numbers into PDFs with ease. Choose positions, dimensions, typography.' },
    { dir: 'add-watermark', title: 'Add Watermark to PDF', desc: 'Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.' },
    { dir: 'compare-pdf', title: 'Compare PDF Files', desc: 'Compare two PDF documents to quickly spot the differences.' },
    { dir: 'compress-pdf', title: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.' },
    { dir: 'crop-pdf', title: 'Crop PDF', desc: 'Crop PDF visually. Remove margins or hidden parts of PDF pages.' },
    { dir: 'excel-to-pdf', title: 'Excel to PDF', desc: 'Make EXCEL spreadsheets easy to read by converting them to PDF.' },
    { dir: 'html-to-pdf', title: 'HTML to PDF', desc: 'Convert webpages in HTML to PDF.' },
    { dir: 'jpg-to-pdf', title: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.' },
    { dir: 'merge-pdf', title: 'Merge PDF', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.' },
    { dir: 'pdf-to-excel', title: 'PDF to EXCEL', desc: 'Convert PDF data to EXCEL spreadsheets.' },
    { dir: 'pdf-to-jpg', title: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.' },
    { dir: 'pdf-to-pdf-a', title: 'PDF to PDF/A', desc: 'Convert PDF documents to PDF/A for archiving and long-term preservation.' },
    { dir: 'pdf-to-powerpoint', title: 'PDF to Powerpoint', desc: 'Turn your PDF files into easy to edit PPTX slideshows.' },
    { dir: 'pdf-to-word', title: 'PDF to Word Converter', desc: 'Convert PDF files to editable Word documents (.docx) for free. No signup required. Fast, secure, and works in your browser.' },
    { dir: 'powerpoint-to-pdf', title: 'Powerpoint to PDF', desc: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.' },
    { dir: 'protect-pdf', title: 'Protect PDF', desc: 'Encrypt your PDF with a password to keep sensitive data confidential.' },
    { dir: 'redact-pdf', title: 'Redact PDF', desc: 'Permanently remove sensitive information from PDFs.' },
    { dir: 'rotate-pdf', title: 'Rotate PDF', desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!' },
    { dir: 'split-pdf', title: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion into independent PDF files.' },
    { dir: 'unlock-pdf', title: 'Unlock PDF', desc: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.' },
    { dir: 'word-to-pdf', title: 'Word to PDF', desc: 'Make DOC and DOCX files easy to read by converting them to PDF.' }
];

tools.forEach(tool => {
    const dirPath = path.join('app', tool.dir);
    if (fs.existsSync(dirPath)) {
        const layoutPath = path.join(dirPath, 'layout.jsx');
        const content = `export const metadata = {
  title: '${tool.title} – Free Online Tool | SababPDF',
  description: '${tool.desc}',
  keywords: '${tool.title.toLowerCase()}, free pdf tool',
  openGraph: {
    title: '${tool.title} | SababPDF',
    description: '${tool.desc}',
    url: 'https://sababpdf.com/${tool.dir}',
    siteName: 'SababPDF',
    type: 'website',
  },
};

export default function Layout({ children }) {
  return children;
}
`;
        fs.writeFileSync(layoutPath, content);
        console.log('Created layout for:', tool.dir);
    } else {
        console.log('Skipped (dir not found):', tool.dir);
    }
});
