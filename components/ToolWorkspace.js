'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import FileUploader, { FileList, SinglePdfPreviewCard } from './FileUploader';
import PdfToWordPreview from './PdfToWordPreview';
import {
  addPageNumbers,
  addWatermark,
  compressPDF,
  deletePages,
  downloadBlob,
  formatBytes,
  getPdfPagePreviews,
  getPDFPageCount,
  imagesToPDF,
  mergePDFs,
  pdfToImages,
  reorderPages,
  rotatePDF,
  splitPDF,
  splitPDFAllPages,
  svgToJpg,
} from '../lib/pdfUtils';

const SUPPORTED_API_TOOLS = [
  'word-to-pdf',
  'excel-to-pdf',
  'ppt-to-pdf',
  'html-to-pdf',
  'pdf-to-word',
  'pdf-to-excel',
];

const CLIENT_TOOLS = new Set([
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'rotate-pdf',
  'delete-pages',
  'reorder-pages',
  'jpg-to-pdf',
  'svg-to-jpg',
  'pdf-to-jpg',
  'watermark-pdf',
  'add-page-numbers',
]);

const DOWNLOAD_BUTTON_TOOLS = new Set([
  ...CLIENT_TOOLS,
  ...SUPPORTED_API_TOOLS,
]);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const LOCAL_API_TOOLS = new Set(['pdf-to-word']);
const PROCESSING_PROGRESS_CAP = 99;

function parseNumberList(input, pageCount) {
  if (!input.trim()) {
    throw new Error('Enter at least one page number.');
  }

  const pages = new Set();

  input
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (token.includes('-')) {
        const [startRaw, endRaw] = token.split('-').map((part) => Number(part.trim()));
        if (!Number.isInteger(startRaw) || !Number.isInteger(endRaw) || startRaw < 1 || endRaw < startRaw) {
          throw new Error(`Invalid range "${token}".`);
        }

        for (let page = startRaw; page <= endRaw; page += 1) {
          if (pageCount && page > pageCount) {
            throw new Error(`Page ${page} is outside this file.`);
          }
          pages.add(page);
        }
        return;
      }

      const page = Number(token);
      if (!Number.isInteger(page) || page < 1) {
        throw new Error(`Invalid page "${token}".`);
      }
      if (pageCount && page > pageCount) {
        throw new Error(`Page ${page} is outside this file.`);
      }
      pages.add(page);
    });

  return Array.from(pages).sort((left, right) => left - right);
}

function parseSplitGroups(input, pageCount) {
  const groups = input
    .split(/[|;]/)
    .map((group) => group.trim())
    .filter(Boolean)
    .map((group) => parseNumberList(group, pageCount));

  if (!groups.length) {
    throw new Error('Enter at least one page group.');
  }

  return groups;
}

function parseOrder(input, pageCount) {
  const numbers = input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value));

  if (!numbers.length) {
    throw new Error('Enter the full page order, for example 3,1,2.');
  }

  if (pageCount && numbers.length !== pageCount) {
    throw new Error(`This file has ${pageCount} pages. Provide exactly ${pageCount} numbers.`);
  }

  const unique = new Set(numbers);
  if (unique.size !== numbers.length) {
    throw new Error('Each page can appear only once in the new order.');
  }

  if (Math.min(...numbers) < 1 || (pageCount && Math.max(...numbers) > pageCount)) {
    throw new Error('The page order contains a number outside this file.');
  }

  return numbers.map((value) => value - 1);
}

async function downloadZip(entries, filename) {
  const zip = new JSZip();
  entries.forEach(({ name, blob }) => zip.file(name, blob));
  return zip.generateAsync({ type: 'blob' });
}

function getAcceptTypes(toolId) {
  switch (toolId) {
    case 'jpg-to-pdf':
      return '.jpg,.jpeg,.png,.webp';
    case 'word-to-pdf':
      return '.doc,.docx';
    case 'excel-to-pdf':
      return '.xls,.xlsx';
    case 'ppt-to-pdf':
      return '.ppt,.pptx';
    case 'svg-to-jpg':
      return '.svg';
    case 'html-to-pdf':
      return '.html,.htm';
    default:
      return '.pdf';
  }
}

function getUploadConfig(toolId) {
  switch (toolId) {
    case 'merge-pdf':
      return {
        multiple: true,
        label: 'Drop PDF files here',
        description: 'Upload two or more PDF files in the order you want to merge.',
      };
    case 'compress-pdf':
      return {
        multiple: false,
        label: 'Drop a PDF to compress',
        description: 'Upload one PDF, choose a target size in KB or MB, and adjust the compression level.',
      };
    case 'jpg-to-pdf':
      return {
        multiple: true,
        label: 'Drop image files here',
        description: 'Upload JPG, PNG, or WebP files to combine into one PDF.',
      };
    case 'svg-to-jpg':
      return {
        multiple: false,
        label: 'Drop an SVG file here',
        description: 'Convert one SVG image into a JPG file. Transparent areas will use a white background.',
      };
    case 'pdf-to-jpg':
      return {
        multiple: false,
        label: 'Drop a PDF here',
        description: 'Each page will be exported as a JPG image inside a ZIP file.',
      };
    case 'pdf-to-word':
      return {
        multiple: false,
        label: 'Drop a PDF to convert to Word',
        description: 'Upload one PDF, then choose No OCR, OCR, or Keep PDF layout before you start the conversion. No OCR uses the stronger editable converter first.',
      };
    case 'pdf-to-excel':
      return {
        multiple: false,
        label: 'Drop a PDF to convert to Excel',
        description: 'Upload one PDF and extract detected table data into an XLSX spreadsheet.',
      };
    case 'word-to-pdf':
      return {
        multiple: false,
        label: 'Drop a Word file here',
        description: 'Upload one DOC or DOCX file to convert it into PDF.',
      };
    case 'excel-to-pdf':
      return {
        multiple: false,
        label: 'Drop an Excel file here',
        description: 'Upload one XLS or XLSX file to convert spreadsheet pages into PDF.',
      };
    case 'ppt-to-pdf':
      return {
        multiple: false,
        label: 'Drop a PowerPoint file here',
        description: 'Upload one PPT or PPTX file to convert slides into PDF.',
      };
    case 'html-to-pdf':
      return {
        multiple: false,
        label: 'Drop an HTML file here',
        description: 'Upload one HTML file and convert it into a PDF document.',
      };
    default:
      return {
        multiple: false,
        label: 'Drop your file here',
        description: 'Browser-side tools stay in the current tab and process locally.',
      };
  }
}

function outputName(sourceName, suffix) {
  const base = sourceName.replace(/\.[^.]+$/, '');
  return `${base}-${suffix}.pdf`;
}

function formatPageSequence(pages) {
  if (!pages.length) {
    return '';
  }

  const sorted = Array.from(new Set(pages)).sort((left, right) => left - right);
  const segments = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index];

    if (current === previous + 1) {
      previous = current;
      continue;
    }

    segments.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  return segments.join(', ');
}

function getCompressionLabel(strength) {
  if (strength < 34) {
    return 'Light compression';
  }

  if (strength < 67) {
    return 'Balanced compression';
  }

  return 'Strong compression';
}

function parseTargetBytes(value, unit) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.round(numericValue * (unit === 'mb' ? 1024 * 1024 : 1024));
}

function getProcessingLabel(toolId, progress, isClientTool, pdfToWordMode = 'no-ocr') {
  if (progress >= 100) {
    return 'Completed';
  }

  if (toolId === 'pdf-to-word') {
    if (progress < 12) return 'Starting';
    if (progress < 28) return 'Uploading PDF';
    if (pdfToWordMode === 'layout') return 'Preserving page layout in DOCX';
    if (pdfToWordMode === 'ocr') return 'Running OCR and building DOCX';
    return 'Converting with enhanced DOCX engine';
  }

  if (!isClientTool) {
    if (progress < 12) return 'Starting';
    if (progress < 28) return 'Uploading file';
    return 'Processing on server';
  }

  if (progress < 12) return 'Starting';

  switch (toolId) {
    case 'merge-pdf':
      if (progress < 34) return 'Reading PDFs';
      if (progress < 82) return 'Combining pages';
      return 'Preparing merged file';
    case 'split-pdf':
      if (progress < 34) return 'Reading pages';
      if (progress < 82) return 'Creating split files';
      return 'Preparing ZIP download';
    case 'compress-pdf':
      if (progress < 34) return 'Reading PDF';
      if (progress < 82) return 'Compressing pages';
      return 'Preparing compressed file';
    case 'rotate-pdf':
      if (progress < 34) return 'Reading pages';
      if (progress < 82) return 'Rotating pages';
      return 'Preparing rotated file';
    case 'delete-pages':
      if (progress < 34) return 'Reading pages';
      if (progress < 82) return 'Removing pages';
      return 'Preparing updated file';
    case 'reorder-pages':
      if (progress < 34) return 'Reading page order';
      if (progress < 82) return 'Reordering pages';
      return 'Preparing updated file';
    case 'jpg-to-pdf':
      if (progress < 34) return 'Loading images';
      if (progress < 82) return 'Building PDF';
      return 'Preparing PDF download';
    case 'svg-to-jpg':
      if (progress < 34) return 'Reading SVG';
      if (progress < 82) return 'Rendering JPG';
      return 'Preparing image download';
    case 'pdf-to-jpg':
      if (progress < 34) return 'Reading pages';
      if (progress < 82) return 'Exporting JPG pages';
      return 'Preparing ZIP download';
    case 'watermark-pdf':
      if (progress < 34) return 'Reading PDF';
      if (progress < 82) return 'Applying watermark';
      return 'Preparing updated file';
    case 'add-page-numbers':
      if (progress < 34) return 'Reading PDF';
      if (progress < 82) return 'Adding page numbers';
      return 'Preparing updated file';
    default:
      if (progress < 34) return 'Preparing file';
      if (progress < 82) return 'Processing file';
      return 'Preparing download';
  }
}

function getEstimatedProcessingDuration(toolId, { fileSize = 0, pageCount = 0, isClientTool = false, pdfToWordMode = 'no-ocr' } = {}) {
  const fileSizeMB = fileSize > 0 ? fileSize / (1024 * 1024) : 0;

  if (toolId === 'pdf-to-word') {
    if (pdfToWordMode === 'layout') {
      return Math.min(10 * 60 * 1000, Math.max(20 * 1000, 14 * 1000 + pageCount * 210 + fileSizeMB * 1400));
    }

    if (pdfToWordMode === 'ocr') {
      return Math.min(12 * 60 * 1000, Math.max(22 * 1000, 16 * 1000 + pageCount * 240 + fileSizeMB * 1600));
    }

    return Math.min(6 * 60 * 1000, Math.max(7 * 1000, 4 * 1000 + pageCount * 900 + fileSizeMB * 500));
  }

  if (!isClientTool) {
    return Math.min(2 * 60 * 1000, Math.max(8 * 1000, 6 * 1000 + fileSizeMB * 850));
  }

  switch (toolId) {
    case 'merge-pdf':
      return Math.min(60 * 1000, Math.max(5 * 1000, 4 * 1000 + pageCount * 80 + fileSizeMB * 350));
    case 'split-pdf':
      return Math.min(60 * 1000, Math.max(5 * 1000, 4 * 1000 + pageCount * 70 + fileSizeMB * 300));
    case 'compress-pdf':
      return Math.min(90 * 1000, Math.max(7 * 1000, 5 * 1000 + pageCount * 110 + fileSizeMB * 450));
    case 'pdf-to-jpg':
      return Math.min(90 * 1000, Math.max(7 * 1000, 5 * 1000 + pageCount * 95 + fileSizeMB * 380));
    default:
      return Math.min(45 * 1000, Math.max(4 * 1000, 3 * 1000 + pageCount * 45 + fileSizeMB * 220));
  }
}

export default function ToolWorkspace({ tool }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('idle');
  const [pendingDownload, setPendingDownload] = useState(null);
  const [processProgress, setProcessProgress] = useState(0);
  const [pageCount, setPageCount] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [orderInput, setOrderInput] = useState('');
  const [splitMode, setSplitMode] = useState('ranges');
  const [splitInput, setSplitInput] = useState('1-2 | 3-4');
  const [rotation, setRotation] = useState('90');
  const [watermarkText, setWatermarkText] = useState('Confidential');
  const [pagePosition, setPagePosition] = useState('bottom-center');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [compressStrength, setCompressStrength] = useState(55);
  const [compressTargetValue, setCompressTargetValue] = useState('');
  const [compressTargetUnit, setCompressTargetUnit] = useState('mb');
  const [pdfToWordMode, setPdfToWordMode] = useState('no-ocr');
  const [splitPreviewOpen, setSplitPreviewOpen] = useState(false);
  const [splitPreviewItems, setSplitPreviewItems] = useState([]);
  const [splitPreviewLoading, setSplitPreviewLoading] = useState(false);
  const [splitPreviewError, setSplitPreviewError] = useState('');
  const [reorderPreviewItems, setReorderPreviewItems] = useState([]);
  const [reorderPreviewLoading, setReorderPreviewLoading] = useState(false);
  const [reorderPreviewError, setReorderPreviewError] = useState('');
  const progressTimerRef = useRef(null);
  const processStartedAtRef = useRef(0);

  const supportsClientTool = CLIENT_TOOLS.has(tool.id);
  const uploadConfig = useMemo(() => getUploadConfig(tool.id), [tool.id]);
  const compressionLabel = useMemo(() => getCompressionLabel(compressStrength), [compressStrength]);
  const compressionTargetBytes = useMemo(
    () => parseTargetBytes(compressTargetValue, compressTargetUnit),
    [compressTargetUnit, compressTargetValue],
  );
  const estimatedProcessingDuration = useMemo(
    () => getEstimatedProcessingDuration(tool.id, {
      fileSize: files[0]?.size || 0,
      pageCount: pageCount || 0,
      isClientTool: supportsClientTool,
      pdfToWordMode,
    }),
    [files, pageCount, pdfToWordMode, supportsClientTool, tool.id],
  );
  const actionSignature = useMemo(() => {
    switch (tool.id) {
      case 'split-pdf':
        return `${tool.id}:${splitMode}:${splitInput}`;
      case 'compress-pdf':
        return `${tool.id}:${compressStrength}:${compressTargetValue}:${compressTargetUnit}`;
      case 'rotate-pdf':
        return `${tool.id}:${rotation}`;
      case 'delete-pages':
        return `${tool.id}:${deleteInput}`;
      case 'reorder-pages':
        return `${tool.id}:${orderInput}`;
      case 'watermark-pdf':
        return `${tool.id}:${watermarkText}`;
      case 'add-page-numbers':
        return `${tool.id}:${pagePosition}:${prefix}:${suffix}`;
      case 'pdf-to-word':
        return `${tool.id}:${pdfToWordMode}`;
      default:
        return tool.id;
    }
  }, [
    compressStrength,
    compressTargetUnit,
    compressTargetValue,
    deleteInput,
    orderInput,
    pagePosition,
    prefix,
    pdfToWordMode,
    rotation,
    splitInput,
    splitMode,
    suffix,
    tool.id,
    watermarkText,
  ]);
  const lastActionSignatureRef = useRef(actionSignature);
  const compressedPreviewFile = useMemo(() => {
    if (tool.id !== 'compress-pdf' || !pendingDownload?.blob) {
      return null;
    }

    return new File([pendingDownload.blob], pendingDownload.filename || 'compressed.pdf', {
      type: pendingDownload.blob.type || 'application/pdf',
    });
  }, [pendingDownload, tool.id]);
  const splitPreviewConfig = useMemo(() => {
    if (tool.id !== 'split-pdf' || !pageCount) {
      return {
        title: 'Preview selected pages',
        detail: 'Upload a PDF to preview the pages you plan to split.',
        pageNumbers: [],
        groupLabels: [],
        warning: '',
      };
    }

    if (splitMode === 'all') {
      const previewCount = Math.min(pageCount, 12);
      return {
        title: 'Preview pages before splitting',
        detail:
          pageCount > previewCount
            ? `Showing the first ${previewCount} pages. Each page will be exported as its own PDF.`
            : 'Each page will be exported as its own PDF.',
        pageNumbers: Array.from({ length: previewCount }, (_, index) => index + 1),
        groupLabels: [],
        warning: '',
      };
    }

    try {
      const groups = parseSplitGroups(splitInput, pageCount);
      const selectedPages = Array.from(new Set(groups.flat())).sort((left, right) => left - right);
      const previewPages = selectedPages.slice(0, 12);

      return {
        title: 'Preview selected pages',
        detail:
          selectedPages.length > previewPages.length
            ? `Showing the first ${previewPages.length} selected pages from ${groups.length} split parts.`
            : `Showing the pages included in ${groups.length} split part${groups.length === 1 ? '' : 's'}.`,
        pageNumbers: previewPages,
        groupLabels: groups.map((group, index) => `Part ${index + 1}: ${formatPageSequence(group)}`),
        warning: '',
      };
    } catch (error) {
      const fallbackCount = Math.min(pageCount, 6);
      return {
        title: 'Preview pages before splitting',
        detail: `Showing the first ${fallbackCount} pages until the split rule is valid.`,
        pageNumbers: Array.from({ length: fallbackCount }, (_, index) => index + 1),
        groupLabels: [],
        warning: error.message || 'Enter a valid split rule to preview the selected pages.',
      };
    }
  }, [pageCount, splitInput, splitMode, tool.id]);
  const reorderPreviewConfig = useMemo(() => {
    if (tool.id !== 'reorder-pages' || !pageCount) {
      return {
        title: 'Page order preview',
        detail: 'Upload a PDF to preview the page order.',
        pageNumbers: [],
        warning: '',
      };
    }

    const previewCount = Math.min(pageCount, 12);
    const defaultOrder = Array.from({ length: previewCount }, (_, index) => index + 1);

    if (!orderInput.trim()) {
      return {
        title: 'Current page order',
        detail:
          pageCount > previewCount
            ? `Showing the first ${previewCount} pages in the current order.`
            : 'Showing the current page order.',
        pageNumbers: defaultOrder,
        warning: '',
      };
    }

    try {
      const order = parseOrder(orderInput, pageCount).map((pageIndex) => pageIndex + 1);
      return {
        title: 'New page order preview',
        detail:
          order.length > previewCount
            ? `Showing the first ${previewCount} pages in the new order you typed.`
            : 'Showing the full new page order you typed.',
        pageNumbers: order.slice(0, previewCount),
        warning: '',
      };
    } catch (error) {
      return {
        title: 'Current page order',
        detail: `Showing the first ${previewCount} pages until the page order is valid.`,
        pageNumbers: defaultOrder,
        warning: error.message || 'Enter the full page order to preview the new sequence.',
      };
    }
  }, [orderInput, pageCount, tool.id]);

  useEffect(() => {
    setMessage('');
    setMessageTone('idle');
    setPendingDownload(null);
    setProcessProgress(0);
    setSplitPreviewOpen(false);
    setSplitPreviewItems([]);
    setSplitPreviewError('');
    setSplitPreviewLoading(false);
    setReorderPreviewItems([]);
    setReorderPreviewError('');
    setReorderPreviewLoading(false);
  }, [tool.id, files]);

  useEffect(() => {
    if (!busy) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      processStartedAtRef.current = 0;
      return undefined;
    }

    if (!processStartedAtRef.current) {
      processStartedAtRef.current = Date.now();
    }

    setProcessProgress((current) => (current > 0 ? current : 1));

    progressTimerRef.current = setInterval(() => {
      setProcessProgress((current) => {
        if (current >= PROCESSING_PROGRESS_CAP) {
          return current;
        }

        const elapsed = Date.now() - processStartedAtRef.current;
        const target = Math.min(
          PROCESSING_PROGRESS_CAP,
          Math.max(1, Math.round((elapsed / estimatedProcessingDuration) * PROCESSING_PROGRESS_CAP)),
        );

        return target > current ? target : current;
      });
    }, 250);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [busy, estimatedProcessingDuration]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageCount() {
      if (!files.length || tool.id === 'jpg-to-pdf' || tool.id === 'merge-pdf') {
        setPageCount(null);
        return;
      }

      const [firstFile] = files;
      if (!firstFile || !firstFile.name.toLowerCase().endsWith('.pdf')) {
        setPageCount(null);
        return;
      }

      try {
        const count = await getPDFPageCount(firstFile);
        if (!cancelled) {
          setPageCount(count);
        }
      } catch {
        if (!cancelled) {
          setPageCount(null);
        }
      }
    }

    loadPageCount();

    return () => {
      cancelled = true;
    };
  }, [files, tool.id]);

  useEffect(() => {
    if (tool.id !== 'compress-pdf') {
      return;
    }

    if (!files[0]) {
      setCompressTargetValue('');
      setCompressTargetUnit('mb');
      setCompressStrength(55);
      return;
    }

    const suggestedBytes = Math.max(Math.round(files[0].size * 0.65), 120 * 1024);

    if (suggestedBytes >= 1024 * 1024) {
      setCompressTargetUnit('mb');
      setCompressTargetValue((suggestedBytes / (1024 * 1024)).toFixed(suggestedBytes >= 10 * 1024 * 1024 ? 1 : 2));
    } else {
      setCompressTargetUnit('kb');
      setCompressTargetValue(String(Math.max(60, Math.round(suggestedBytes / 1024))));
    }
  }, [files, tool.id]);

  useEffect(() => {
    if (lastActionSignatureRef.current === actionSignature) {
      return;
    }

    lastActionSignatureRef.current = actionSignature;

    if (!pendingDownload && messageTone !== 'success') {
      return;
    }

    setPendingDownload(null);
    setMessage('');
    setMessageTone('idle');
    setProcessProgress(0);
  }, [actionSignature, messageTone, pendingDownload]);

  useEffect(() => {
    if (!files.length) {
      processStartedAtRef.current = 0;
      setProcessProgress(0);
    }
  }, [files.length]);

  useEffect(() => {
    let cancelled = false;

    async function loadSplitPreview() {
      if (tool.id !== 'split-pdf' || !splitPreviewOpen || !files[0] || !splitPreviewConfig.pageNumbers.length) {
        setSplitPreviewItems([]);
        setSplitPreviewLoading(false);
        setSplitPreviewError('');
        return;
      }

      setSplitPreviewLoading(true);
      setSplitPreviewError('');

      try {
        const preview = await getPdfPagePreviews(files[0], splitPreviewConfig.pageNumbers, 132);
        if (!cancelled) {
          setSplitPreviewItems(preview.pages);
        }
      } catch (error) {
        if (!cancelled) {
          setSplitPreviewItems([]);
          setSplitPreviewError(error.message || 'Could not load the PDF preview.');
        }
      } finally {
        if (!cancelled) {
          setSplitPreviewLoading(false);
        }
      }
    }

    loadSplitPreview();

    return () => {
      cancelled = true;
    };
  }, [files, splitPreviewConfig.pageNumbers, splitPreviewOpen, tool.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadReorderPreview() {
      if (tool.id !== 'reorder-pages' || !files[0] || !reorderPreviewConfig.pageNumbers.length) {
        setReorderPreviewItems([]);
        setReorderPreviewLoading(false);
        setReorderPreviewError('');
        return;
      }

      setReorderPreviewLoading(true);
      setReorderPreviewError('');

      try {
        const preview = await getPdfPagePreviews(files[0], reorderPreviewConfig.pageNumbers, 132);
        if (!cancelled) {
          setReorderPreviewItems(preview.pages);
        }
      } catch (error) {
        if (!cancelled) {
          setReorderPreviewItems([]);
          setReorderPreviewError(error.message || 'Could not load the page-order preview.');
        }
      } finally {
        if (!cancelled) {
          setReorderPreviewLoading(false);
        }
      }
    }

    loadReorderPreview();

    return () => {
      cancelled = true;
    };
  }, [files, reorderPreviewConfig.pageNumbers, tool.id]);

  const handleFiles = (nextFiles) => {
    setFiles((current) => (uploadConfig.multiple ? [...current, ...nextFiles] : nextFiles));
  };

  const handleRemove = (index) => {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const progressLabel = useMemo(() => {
    if (messageTone === 'success') {
      return 'Completed';
    }

    if (messageTone === 'error') {
      return 'Stopped';
    }

    if (!busy && !processProgress) {
      return 'Waiting to start';
    }

    return getProcessingLabel(tool.id, processProgress || 1, supportsClientTool, pdfToWordMode);
  }, [busy, messageTone, pdfToWordMode, processProgress, supportsClientTool, tool.id]);

  const progressValue = useMemo(() => {
    if (messageTone === 'success') {
      return 100;
    }

    if (busy) {
      return Math.max(1, processProgress);
    }

    return processProgress;
  }, [busy, messageTone, processProgress]);

  const statusSummary = useMemo(() => {
    if (busy) {
      return {
        tone: 'processing',
        title: `${tool.title} is processing`,
        detail: supportsClientTool
          ? 'Keep this tab open while the file is processed in your browser. The main button will switch to download when the result is ready.'
          : tool.id === 'pdf-to-word'
          ? pdfToWordMode === 'layout'
                ? 'The app server is preserving each PDF page visually inside the DOCX. Large PDFs can take several minutes in this mode.'
              : pdfToWordMode === 'ocr'
                ? 'The app server is using OCR for scanned or image-based PDFs. This is slower, but it can make non-selectable text editable in Word.'
                : 'The app server is using the stronger editable DOCX engine for selectable-text PDFs first, with a faster small-file profile when possible.'
            : `The file is being sent to ${API_BASE_URL} and converted on the configured server.`,
      };
    }

    if (messageTone === 'success') {
      return {
        tone: 'success',
        title: 'Completed',
        detail:
          message || 'Your file is ready. Use the main button below when you are ready to download it.',
      };
    }

    if (messageTone === 'error') {
      return {
        tone: 'error',
        title: 'Action needed',
        detail: message || 'Check your file and settings, then try again.',
      };
    }

    if (files.length) {
      const mergeSummary = tool.id === 'merge-pdf';
      const splitSummary = tool.id === 'split-pdf';
      const compressSummary = tool.id === 'compress-pdf';
      const rotateSummary = tool.id === 'rotate-pdf';
      const reorderSummary = tool.id === 'reorder-pages';
      const pdfToWordSummary = tool.id === 'pdf-to-word';
      return {
        tone: 'ready',
        title: mergeSummary
          ? `${files.length} PDF${files.length === 1 ? '' : 's'} added`
          : `${files.length} file${files.length === 1 ? '' : 's'} ready`,
        detail: mergeSummary
          ? 'Review the preview cards, confirm the merge order, and click Start Merge PDF.'
          : splitSummary
            ? `Review the preview card${pageCount ? `, confirm the ${pageCount} detected pages,` : ''} and click Start ${tool.title}.`
            : compressSummary
              ? 'Adjust the target size and compression level below, then click Start Compress PDF.'
            : rotateSummary
              ? 'Review the preview card, choose the rotation angle below, and click Start Rotate PDF.'
            : reorderSummary
              ? 'Review the preview, type the full new order below, and click Start Reorder Pages.'
            : pdfToWordSummary
              ? pdfToWordMode === 'layout'
                ? `Review the conversion summary${pageCount ? `, confirm the ${pageCount} detected pages,` : ''} and click Start PDF to Word. This mode keeps the page look closest to the PDF.`
                : pdfToWordMode === 'ocr'
                  ? `Review the conversion summary${pageCount ? `, confirm the ${pageCount} detected pages,` : ''} and click Start PDF to Word. OCR mode is best for scanned PDFs with non-selectable text.`
                  : `Review the conversion summary${pageCount ? `, confirm the ${pageCount} detected pages,` : ''} and click Start PDF to Word. No OCR mode is best for digital PDFs with selectable text and now uses the stronger editable converter first.`
            : `Review the file list${pageCount ? `, confirm the ${pageCount} detected pages,` : ''} and click Start ${tool.title}.`,
      };
    }

    return {
      tone: 'idle',
      title: 'Add files to begin',
      detail: `${uploadConfig.description} Then click Start ${tool.title} to run the tool.`,
    };
  }, [API_BASE_URL, busy, files.length, message, messageTone, pageCount, pdfToWordMode, supportsClientTool, tool.title, uploadConfig.description]);

  const workflowSteps = useMemo(() => {
    const uploadState = files.length || busy || messageTone === 'success' ? 'complete' : 'active';
    const processState = messageTone === 'success' ? 'complete' : busy ? 'active' : files.length ? 'ready' : 'pending';
    const doneState = messageTone === 'success' ? 'complete' : 'pending';

    return [
      {
        id: 'upload',
        title: 'Add files',
        detail: uploadConfig.multiple ? 'Upload one or more supported files.' : 'Upload the file you want to process.',
        state: uploadState,
        symbol: '+',
      },
      {
        id: 'process',
        title: 'Processing',
        detail: `Choose any settings below and start ${tool.title}.`,
        state: processState,
        symbol: busy ? null : '…',
      },
      {
        id: 'done',
        title: 'Completed',
        detail: `When ${tool.title} finishes, the main button changes to download so you can save the result when you are ready.`,
        state: doneState,
        symbol: '✓',
      },
    ];
  }, [busy, files.length, messageTone, tool.id, tool.title, uploadConfig.multiple]);

  async function runBackendTool() {
    if (!files.length) {
      throw new Error('Upload a file first.');
    }

    const formData = new FormData();
    formData.append('file', files[0]);
    if (tool.id === 'pdf-to-word') {
      formData.append('mode', pdfToWordMode);
    }

    const endpoint = `/api/convert/${tool.id}`;
    let response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      if (LOCAL_API_TOOLS.has(tool.id)) {
        throw new Error('Could not reach the built-in PDF to Word converter. Restart the app server and try again.');
      }

      throw new Error(`Could not access the conversion API. Please ensure the backend server is running.`);
    }

    if (!response.ok) {
      const body = await response.json().catch(async () => {
        const text = await response.text().catch(() => '');
        return text ? { error: text } : {};
      });
      throw new Error(body.error || 'The conversion server returned an error.');
    }

    const extension = tool.id.includes('excel') ? 'xlsx' : tool.id.includes('word') ? 'docx' : 'pdf';
    const blob = await response.blob();
    const isNoOcrPdfToWord = tool.id === 'pdf-to-word' && pdfToWordMode === 'no-ocr';
    const isOcrPdfToWord = tool.id === 'pdf-to-word' && pdfToWordMode === 'ocr';
    const isLayoutPdfToWord = tool.id === 'pdf-to-word' && pdfToWordMode === 'layout';
    return {
      message: tool.id === 'pdf-to-word'
        ? isLayoutPdfToWord
          ? 'Layout-preserving DOCX completed. Download the Word file when you are ready.'
          : isOcrPdfToWord
            ? 'OCR DOCX completed. Download the Word file when you are ready.'
            : 'Editable DOCX completed. Download the Word file when you are ready.'
        : `Conversion completed. Download the ${extension.toUpperCase()} file when you are ready.`,
      download: {
        blob,
        filename: `${files[0].name.replace(/\.[^.]+$/, '')}-converted.${extension}`,
        label: tool.id === 'pdf-to-word'
          ? isLayoutPdfToWord
            ? 'Download layout DOCX'
            : isOcrPdfToWord
              ? 'Download OCR DOCX'
              : 'Download editable DOCX'
          : `Download ${extension.toUpperCase()} file`,
        title: tool.id === 'pdf-to-word'
          ? isLayoutPdfToWord
            ? 'Layout DOCX ready'
            : isOcrPdfToWord
              ? 'OCR DOCX ready'
              : 'Editable DOCX ready'
          : 'Converted file ready',
        description: tool.id === 'pdf-to-word'
          ? isLayoutPdfToWord
            ? 'The app server preserved the PDF page look inside the DOCX. This version matches the original more closely, but the content is not freely editable.'
            : isOcrPdfToWord
              ? 'The app server used OCR for a scanned or image-based PDF. The Word text should be editable, but OCR accuracy depends on scan quality.'
              : 'The app server used the stronger editable DOCX engine for your selectable-text PDF. Text should stay editable and image placement should match the source more closely than before.'
          : LOCAL_API_TOOLS.has(tool.id)
            ? 'The file was converted by the app server. Download the DOCX file when you are ready.'
            : `The file was processed by ${API_BASE_URL}. Download the converted file when you are ready.`,
      },
    };
  }

  async function runClientTool() {
    if (!files.length) {
      throw new Error('Upload a file first.');
    }

    switch (tool.id) {
      case 'merge-pdf': {
        if (files.length < 2) {
          throw new Error('Upload at least two PDF files to merge.');
        }
        const merged = await mergePDFs(files);
        return {
          message: 'Merge completed. Download the merged PDF when you are ready.',
          download: {
            blob: merged,
            filename: 'merged.pdf',
            label: 'Download merged PDF',
            title: 'Merged PDF ready',
            description: 'Your merge is complete. Download the final PDF when you are ready.',
          },
        };
      }

      case 'split-pdf': {
        const source = files[0];
        const zipName = `${source.name.replace(/\.[^.]+$/, '')}-split.zip`;

        if (splitMode === 'all') {
          const splitFiles = await splitPDFAllPages(source);
          const zipBlob = await downloadZip(splitFiles, `${source.name.replace(/\.[^.]+$/, '')}-pages.zip`);
          return {
            message: 'Split completed. Download the ZIP file when you are ready.',
            download: {
              blob: zipBlob,
              filename: `${source.name.replace(/\.[^.]+$/, '')}-pages.zip`,
              label: 'Download split ZIP',
              title: 'Split ZIP ready',
              description: 'Each page has been prepared as a separate PDF inside one ZIP file.',
            },
          };
        }

        const groups = parseSplitGroups(splitInput, pageCount);
        const blobs = await splitPDF(source, groups);
        const zipBlob = await downloadZip(
          blobs.map((blob, index) => ({
            name: `${source.name.replace(/\.[^.]+$/, '')}-part-${index + 1}.pdf`,
            blob,
          })),
          zipName,
        );
        return {
          message: 'Split completed. Download the ZIP file when you are ready.',
          download: {
            blob: zipBlob,
            filename: zipName,
            label: 'Download split ZIP',
            title: 'Split ZIP ready',
            description: 'Your split PDF files are ready inside one ZIP download.',
          },
        };
      }

      case 'compress-pdf': {
        const blob = await compressPDF(files[0], {
          strength: compressStrength,
          targetBytes: compressionTargetBytes,
        });
        const reduction = files[0].size - blob.size;
        return {
          message:
            reduction > 0
              ? `Compression finished. ${formatBytes(files[0].size)} -> ${formatBytes(blob.size)}.`
              : `Compression finished. This PDF stayed around ${formatBytes(blob.size)} because it could not be reduced much further in the browser.`,
          download: {
            blob,
            filename: outputName(files[0].name, 'compressed'),
            label: 'Download compressed PDF',
            title: 'Compressed PDF ready',
            description:
              reduction > 0
                ? `Preview the compressed PDF below before downloading. New size: ${formatBytes(blob.size)}.`
                : `Preview the result below before downloading. Current size: ${formatBytes(blob.size)}.`,
          },
        };
      }

      case 'rotate-pdf': {
        const blob = await rotatePDF(files[0], Number(rotation));
        return {
          message: 'Rotation completed. Download the rotated PDF when you are ready.',
          download: {
            blob,
            filename: outputName(files[0].name, 'rotated'),
            label: 'Download rotated PDF',
            title: 'Rotated PDF ready',
            description: 'Your rotated PDF is ready. Download it when you are ready.',
          },
        };
      }

      case 'delete-pages': {
        const pagesToDelete = parseNumberList(deleteInput, pageCount).map((page) => page - 1);
        const blob = await deletePages(files[0], pagesToDelete);
        return {
          message: 'Delete pages completed. Use the button to download the updated PDF.',
          download: {
            blob,
            filename: outputName(files[0].name, 'trimmed'),
            label: 'Download updated PDF',
            title: 'Updated PDF ready',
            description: 'Your cleaned PDF is ready. Download it when you are ready.',
          },
        };
      }

      case 'reorder-pages': {
        const order = parseOrder(orderInput, pageCount);
        const blob = await reorderPages(files[0], order);
        return {
          message: 'Page reorder completed. Download the updated PDF when you are ready.',
          download: {
            blob,
            filename: outputName(files[0].name, 'reordered'),
            label: 'Download reordered PDF',
            title: 'Reordered PDF ready',
            description: 'Your PDF page order has been updated. Download it when you are ready.',
          },
        };
      }

      case 'jpg-to-pdf': {
        const blob = await imagesToPDF(files);
        return {
          message: 'PDF created from images. Download it when you are ready.',
          download: {
            blob,
            filename: 'images-to-pdf.pdf',
            label: 'Download PDF',
            title: 'PDF ready',
            description: 'Your images have been combined into one PDF. Download it when you are ready.',
          },
        };
      }

      case 'svg-to-jpg': {
        const blob = await svgToJpg(files[0]);
        return {
          message: 'SVG conversion completed. Download the JPG image when you are ready.',
          download: {
            blob,
            filename: `${files[0].name.replace(/\.[^.]+$/, '')}.jpg`,
            label: 'Download JPG image',
            title: 'JPG image ready',
            description: 'Your SVG has been converted to JPG. Download it when you are ready.',
          },
        };
      }

      case 'pdf-to-jpg': {
        const images = await pdfToImages(files[0]);
        const filename = `${files[0].name.replace(/\.[^.]+$/, '')}-images.zip`;
        const blob = await downloadZip(images, filename);
        return {
          message: 'PDF to JPG completed. Download the ZIP file when you are ready.',
          download: {
            blob,
            filename,
            label: 'Download JPG ZIP',
            title: 'JPG ZIP ready',
            description: 'Each PDF page has been exported as a JPG inside one ZIP file.',
          },
        };
      }

      case 'watermark-pdf': {
        if (!watermarkText.trim()) {
          throw new Error('Enter watermark text.');
        }
        const blob = await addWatermark(files[0], { text: watermarkText.trim() });
        return {
          message: 'Watermark completed. Download the updated PDF when you are ready.',
          download: {
            blob,
            filename: outputName(files[0].name, 'watermarked'),
            label: 'Download watermarked PDF',
            title: 'Watermarked PDF ready',
            description: 'Your watermark has been added. Download the updated PDF when you are ready.',
          },
        };
      }

      case 'add-page-numbers': {
        const blob = await addPageNumbers(files[0], {
          position: pagePosition,
          prefix,
          suffix,
        });
        return {
          message: 'Page numbering completed. Download the updated PDF when you are ready.',
          download: {
            blob,
            filename: outputName(files[0].name, 'numbered'),
            label: 'Download numbered PDF',
            title: 'Numbered PDF ready',
            description: 'Your page numbers have been added. Download the updated PDF when you are ready.',
          },
        };
      }

      default:
        throw new Error('This tool is not configured for browser-side processing.');
    }
  }

  const handleProcess = async () => {
    setBusy(true);
    setMessage('');
    setMessageTone('idle');
    setPendingDownload(null);
    processStartedAtRef.current = Date.now();
    setProcessProgress(1);

    try {
      const result = supportsClientTool
        ? await runClientTool()
        : SUPPORTED_API_TOOLS.includes(tool.id)
          ? await runBackendTool()
          : 'This feature is not enabled in the current build.';

      if (typeof result === 'string') {
        setMessage(result);
      } else {
        setMessage(result.message || 'Completed successfully.');
        setPendingDownload(result.download || null);
      }
      setProcessProgress(100);
      setMessageTone('success');
    } catch (error) {
      setMessage(error.message || 'Something went wrong while processing the file.');
      setPendingDownload(null);
      setMessageTone('error');
    } finally {
      setBusy(false);
    }
  };

  const inlinePendingDownload = DOWNLOAD_BUTTON_TOOLS.has(tool.id) ? pendingDownload : null;
  const primaryActionLabel = busy
    ? `Processing ${String(progressValue).padStart(2, '0')}%`
    : inlinePendingDownload?.label || `Start ${tool.title}`;
  const primaryActionHandler = inlinePendingDownload
    ? () => downloadBlob(inlinePendingDownload.blob, inlinePendingDownload.filename)
    : handleProcess;
  const helperCopy = inlinePendingDownload
    ? 'Processing is complete. Use this button to download the processed file.'
    : busy
      ? 'Keep this tab open. The progress bar below updates until the file is ready.'
    : supportsClientTool
      ? 'Client-side tools process files in the browser. Large files can take a little longer.'
      : tool.id === 'pdf-to-word'
        ? pdfToWordMode === 'layout'
          ? 'Keep PDF layout builds a DOCX that looks much closer to the original PDF, but the page content is not freely editable.'
          : pdfToWordMode === 'ocr'
            ? 'OCR mode is for scanned PDFs with non-selectable text. It needs OCR support on the server and may take longer.'
            : 'No OCR mode is for PDFs that already contain selectable text. It now uses a stronger editable converter first and a faster small-file profile when possible.'
        : `Server-side conversion uses ${API_BASE_URL}.`;

  return (
    <div className="tool-workspace">
      <section className="surface-card">
        <div className="surface-header">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>Process your file</h2>
          </div>
          {pageCount ? <span className="pill">{pageCount} pages detected</span> : null}
        </div>

        {true ? (
          <>
            <FileUploader
              onFiles={handleFiles}
              accept={getAcceptTypes(tool.id)}
              multiple={uploadConfig.multiple}
              label={uploadConfig.label}
              description={uploadConfig.description}
              currentCount={files.length}
              showUploadHint={tool.id === 'merge-pdf' && files.length === 0}
              uploadHintText="Add PDFs here"
            />

            {tool.id === 'split-pdf' && files[0] ? (
              <>
                <SinglePdfPreviewCard
                  file={files[0]}
                  pageCount={pageCount}
                  title="1 PDF ready to split"
                  description="Review the file, then open the page preview below before downloading the split PDFs."
                  actionLabel={splitPreviewOpen ? 'Hide page preview' : 'Preview pages'}
                  onAction={() => setSplitPreviewOpen((current) => !current)}
                  onRemove={() => handleRemove(0)}
                />

                {splitPreviewOpen ? (
                  <section className="split-preview-panel">
                    <div className="split-preview-panel-header">
                      <div>
                        <strong>{splitPreviewConfig.title}</strong>
            <p>{splitPreviewConfig.detail}</p>
                      </div>
                    </div>

                    {splitPreviewConfig.warning ? (
                      <p className="split-preview-warning">{splitPreviewConfig.warning}</p>
                    ) : null}

                    {splitPreviewConfig.groupLabels.length ? (
                      <div className="split-preview-group-row">
                        {splitPreviewConfig.groupLabels.map((label) => (
                          <span key={label} className="split-preview-group-chip">
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {splitPreviewLoading ? (
                      <div className="split-preview-state">
                        <span className="workflow-spinner" aria-hidden="true" />
                        <p>Loading page previews…</p>
                      </div>
                    ) : splitPreviewError ? (
                      <div className="split-preview-state split-preview-state-error">
                        <p>{splitPreviewError}</p>
                      </div>
                    ) : (
                      <div className="split-preview-grid">
                        {splitPreviewItems.map((page) => (
                          <article key={page.pageNumber} className="split-preview-card">
                            <div className="split-preview-thumb">
                              <img
                                src={page.previewUrl}
                                alt={`Preview of page ${page.pageNumber}`}
                                className="split-preview-image"
                              />
                            </div>
                            <p className="split-preview-caption">Page {page.pageNumber}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}
              </>
            ) : tool.id === 'compress-pdf' && files[0] ? (
              <SinglePdfPreviewCard
                file={files[0]}
                pageCount={pageCount}
                title="1 PDF ready to compress"
                description="Set the target size and compression level below, then start compression."
                onRemove={() => handleRemove(0)}
              />
            ) : tool.id === 'pdf-to-word' && files[0] ? (
              <PdfToWordPreview
                file={files[0]}
                pageCount={pageCount}
                mode={pdfToWordMode}
                onModeChange={setPdfToWordMode}
                modeOptions={[
                  {
                    value: 'no-ocr',
                    label: 'No OCR',
                    description: 'Best for PDFs that already have selectable text. Uses the stronger editable converter first so Word text stays editable and page structure usually matches the PDF more closely.',
                  },
                  {
                    value: 'ocr',
                    label: 'OCR',
                    description: 'Best for scanned PDFs or image-based pages with non-selectable text. Slower and depends on OCR support on the server.',
                  },
                  {
                    value: 'layout',
                    label: 'Keep PDF layout',
                    description: 'Best for matching the PDF page look as closely as possible, even though the result is not freely editable.',
                  },
                ]}
                onRemove={() => handleRemove(0)}
              />
            ) : tool.id === 'reorder-pages' && files[0] ? (
              <>
                <SinglePdfPreviewCard
                  file={files[0]}
                  pageCount={pageCount}
                  title="1 PDF ready to reorder"
                  description="Review the PDF, then use the visual order panel below to type the new page sequence."
                  onRemove={() => handleRemove(0)}
                />

                <section className="reorder-preview-panel">
                  <div className="reorder-preview-header">
                    <div>
                      <strong>{reorderPreviewConfig.title}</strong>
                      <p>{reorderPreviewConfig.detail}</p>
                    </div>
                  </div>

                  {reorderPreviewConfig.warning ? (
                    <p className="split-preview-warning">{reorderPreviewConfig.warning}</p>
                  ) : null}

                  {reorderPreviewLoading ? (
                    <div className="split-preview-state">
                      <span className="workflow-spinner" aria-hidden="true" />
                      <p>Loading page order preview…</p>
                    </div>
                  ) : reorderPreviewError ? (
                    <div className="split-preview-state split-preview-state-error">
                      <p>{reorderPreviewError}</p>
                    </div>
                  ) : (
                    <div className="reorder-preview-grid">
                      {reorderPreviewItems.map((page, index) => (
                        <article key={`${page.pageNumber}-${index}`} className="reorder-preview-card">
                          <div className="reorder-preview-position">#{index + 1}</div>
                          <div className="split-preview-thumb">
                            <img
                              src={page.previewUrl}
                              alt={`Preview of page ${page.pageNumber}`}
                              className="split-preview-image"
                            />
                          </div>
                          <p className="split-preview-caption">Page {page.pageNumber}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : tool.id === 'rotate-pdf' && files[0] ? (
              <SinglePdfPreviewCard
                file={files[0]}
                pageCount={pageCount}
                title="1 PDF ready to rotate"
                description="Choose the angle directly below and review the preview before rotating the PDF."
                onRemove={() => handleRemove(0)}
                previewRotation={Number(rotation)}
              />
            ) : (
              <FileList
                files={files}
                onRemove={files.length > 1 ? handleRemove : undefined}
                previewMode={tool.id === 'merge-pdf' ? 'pdf-grid' : 'list'}
              />
            )}

            {tool.id === 'split-pdf' ? (
              <div className="control-grid">
                <div className="field field-wide">
                  <span>Split mode</span>
                  <div className="mode-option-row" role="group" aria-label="Choose how to split the PDF">
                    <button
                      type="button"
                      className={`mode-option-button${splitMode === 'ranges' ? ' mode-option-button-active' : ''}`}
                      onClick={() => setSplitMode('ranges')}
                      aria-pressed={splitMode === 'ranges'}
                    >
                      Page groups
                    </button>
                    <button
                      type="button"
                      className={`mode-option-button${splitMode === 'all' ? ' mode-option-button-active' : ''}`}
                      onClick={() => setSplitMode('all')}
                      aria-pressed={splitMode === 'all'}
                    >
                      Every page separately
                    </button>
                  </div>
                  <small>Choose manual page groups or create one PDF for every page.</small>
                </div>
                {splitMode === 'ranges' ? (
                  <>
                    <label className="field field-wide">
                      <span>Page groups</span>
                      <input
                        value={splitInput}
                        onChange={(event) => setSplitInput(event.target.value)}
                        placeholder="1-2 | 3-4 | 5"
                      />
                      <small>Each group becomes one output PDF. Use the help below if you are not sure about the format.</small>
                    </label>

                    <div className="split-help-panel field-wide">
                      <div className="split-help-header">
                        <strong>How to write the split rule</strong>
                        <p>Each group you type becomes one separate PDF file in the final ZIP download.</p>
                      </div>

                      <div className="split-rule-grid">
                        <article className="split-rule-card">
                          <code>,</code>
                          <strong>Comma</strong>
                          <p>Keep multiple pages in the same output file.</p>
                          <span>Example: <code>1,3,5</code></span>
                        </article>

                        <article className="split-rule-card">
                          <code>-</code>
                          <strong>Range</strong>
                          <p>Select a continuous range of pages.</p>
                          <span>Example: <code>2-6</code></span>
                        </article>

                        <article className="split-rule-card">
                          <code>|</code>
                          <strong>New file</strong>
                          <p>Start a new split PDF after the previous group.</p>
                          <span>Example: <code>1-2 | 3-4 | 5</code></span>
                        </article>
                      </div>

                      <div className="split-help-steps" aria-label="Split PDF steps">
                        <article className="split-help-step">
                          <strong>1. Choose pages for the first PDF</strong>
                          <p>Example: <code>1,2,4-6</code> keeps pages 1, 2, 4, 5, and 6 together.</p>
                        </article>
                        <article className="split-help-step">
                          <strong>2. Use <code>|</code> when you want another PDF</strong>
                          <p>Example: <code>1-2 | 3-4</code> creates two output PDFs.</p>
                        </article>
                        <article className="split-help-step">
                          <strong>3. Preview and run the split</strong>
                          <p>Use the preview, then click Start Split PDF. After processing, click Download split ZIP.</p>
                        </article>
                      </div>

                      <div className="split-example-list">
                        <div className="split-example-item">
                          <code>1-3</code>
                          <p>Creates one PDF that contains pages 1, 2, and 3.</p>
                        </div>
                        <div className="split-example-item">
                          <code>1,4,7</code>
                          <p>Creates one PDF with only pages 1, 4, and 7.</p>
                        </div>
                        <div className="split-example-item">
                          <code>1-2 | 3-4 | 5</code>
                          <p>Creates three PDFs: pages 1-2, pages 3-4, and page 5.</p>
                        </div>
                        <div className="split-example-item">
                          <code>1,3-5 | 8 | 10-12</code>
                          <p>Creates three PDFs with mixed single pages and ranges.</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="split-help-panel field-wide">
                    <div className="split-help-header">
                      <strong>Every page separately</strong>
                      <p>No page rule is needed in this mode.</p>
                    </div>

                    <div className="split-help-steps" aria-label="Every page separately steps">
                      <article className="split-help-step">
                        <strong>1. Upload one PDF</strong>
                        <p>The tool reads the full document and counts the pages automatically.</p>
                      </article>
                      <article className="split-help-step">
                        <strong>2. One page becomes one PDF</strong>
                        <p>If your file has 8 pages, the result will contain 8 separate PDF files.</p>
                      </article>
                      <article className="split-help-step">
                        <strong>3. Download one ZIP file</strong>
                        <p>After processing, click Download split ZIP to save all separated pages at once.</p>
                      </article>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {tool.id === 'compress-pdf' ? (
              <div className="control-grid">
                <label className="field">
                  <span>Original size</span>
                  <div className="field-display">{files[0] ? formatBytes(files[0].size) : 'Add a PDF first'}</div>
                  <small>The tool compares this size against your new compressed result.</small>
                </label>

                <label className="field">
                  <span>Target size</span>
                  <div className="field-inline">
                    <input
                      type="number"
                      min="1"
                      step={compressTargetUnit === 'mb' ? '0.1' : '10'}
                      value={compressTargetValue}
                      onChange={(event) => setCompressTargetValue(event.target.value)}
                      placeholder={compressTargetUnit === 'mb' ? '1.2' : '850'}
                    />
                    <div className="unit-toggle" role="group" aria-label="Choose target size unit">
                      <button
                        type="button"
                        className={`unit-toggle-button${compressTargetUnit === 'kb' ? ' unit-toggle-button-active' : ''}`}
                        onClick={() => setCompressTargetUnit('kb')}
                      >
                        KB
                      </button>
                      <button
                        type="button"
                        className={`unit-toggle-button${compressTargetUnit === 'mb' ? ' unit-toggle-button-active' : ''}`}
                        onClick={() => setCompressTargetUnit('mb')}
                      >
                        MB
                      </button>
                    </div>
                  </div>
                  <small>
                    Set the size you want. The final PDF may be a little above or below this depending on the file
                    content.
                  </small>
                </label>

                <label className="field field-wide">
                  <span>Compression level</span>
                  <div className="compress-slider-card">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={compressStrength}
                      onChange={(event) => setCompressStrength(Number(event.target.value))}
                      className="compress-range"
                    />

                    <div className="compress-slider-values">
                      <div>
                        <strong>{compressStrength}%</strong>
                        <p>{compressionLabel}</p>
                      </div>
                      <div className="compress-target-pill">
                        {compressionTargetBytes ? `Target ${formatBytes(compressionTargetBytes)}` : 'No target size set'}
                      </div>
                    </div>

                    <div className="compress-scale-labels" aria-hidden="true">
                      <span>Better quality</span>
                      <span>Balanced</span>
                      <span>Smaller file</span>
                    </div>
                  </div>
                </label>
              </div>
            ) : null}

            {tool.id === 'rotate-pdf' ? (
              <div className="control-grid">
                <div className="field field-wide">
                  <span>Rotation</span>
                  <div className="rotation-option-row" role="group" aria-label="Choose a rotation angle">
                    {[
                      { value: '90', label: '90° clockwise' },
                      { value: '180', label: '180°' },
                      { value: '270', label: '270° clockwise' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`rotation-option-button${rotation === option.value ? ' rotation-option-button-active' : ''}`}
                        onClick={() => setRotation(option.value)}
                        aria-pressed={rotation === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {tool.id === 'delete-pages' ? (
              <div className="control-grid">
                <label className="field field-wide">
                  <span>Pages to remove</span>
                  <input
                    value={deleteInput}
                    onChange={(event) => setDeleteInput(event.target.value)}
                    placeholder="2, 5-7"
                  />
                  <small>Examples: 2,4,6 or 3-5.</small>
                </label>

                <div className="split-help-panel field-wide">
                  <div className="split-help-header">
                    <strong>How to remove pages</strong>
                    <p>Type the page numbers you want to remove. Everything else will stay in the final PDF.</p>
                  </div>

                  <div className="split-rule-grid">
                    <article className="split-rule-card">
                      <code>42</code>
                      <strong>Single page</strong>
                      <p>Remove one page only.</p>
                      <span>Example: <code>42</code></span>
                    </article>

                    <article className="split-rule-card">
                      <code>,</code>
                      <strong>Comma</strong>
                      <p>Remove multiple separate pages in one step.</p>
                      <span>Example: <code>2,4,6</code></span>
                    </article>

                    <article className="split-rule-card">
                      <code>-</code>
                      <strong>Range</strong>
                      <p>Remove all pages from the first number to the last number.</p>
                      <span>Example: <code>10-15</code></span>
                    </article>
                  </div>

                  <div className="split-help-steps" aria-label="Delete pages steps">
                    <article className="split-help-step">
                      <strong>1. Remove one page</strong>
                      <p>Type only that page number. Example: <code>42</code> removes page 42 only.</p>
                    </article>
                    <article className="split-help-step">
                      <strong>2. Remove several pages</strong>
                      <p>Use commas for separate pages. Example: <code>2,4,6</code> removes pages 2, 4, and 6.</p>
                    </article>
                    <article className="split-help-step">
                      <strong>3. Remove a full range</strong>
                      <p>Use a dash for consecutive pages. Example: <code>8-12</code> removes pages 8, 9, 10, 11, and 12.</p>
                    </article>
                  </div>

                  <div className="split-example-list">
                    <div className="split-example-item">
                      <code>42</code>
                      <p>Removes only page 42.</p>
                    </div>
                    <div className="split-example-item">
                      <code>3,9,14</code>
                      <p>Removes pages 3, 9, and 14.</p>
                    </div>
                    <div className="split-example-item">
                      <code>5-10</code>
                      <p>Removes every page from 5 through 10.</p>
                    </div>
                    <div className="split-example-item">
                      <code>1,4-6,12</code>
                      <p>Removes page 1, pages 4 to 6, and page 12 together.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tool.id === 'reorder-pages' ? (
              <div className="control-grid">
                <label className="field field-wide">
                  <span>New page order</span>
                  <input
                    value={orderInput}
                    onChange={(event) => setOrderInput(event.target.value)}
                    placeholder="3,1,2"
                  />
                  <small>Type every page number once, separated by commas, from the new first page to the new last page.</small>
                </label>

                <div className="split-help-panel field-wide">
                  <div className="split-help-header">
                    <strong>How to reorder pages</strong>
                    <p>Write the full page order from first to last. Every page number must appear exactly one time.</p>
                  </div>

                  <div className="split-rule-grid">
                    <article className="split-rule-card">
                      <code>,</code>
                      <strong>Comma only</strong>
                      <p>Use commas to separate page numbers in the new order.</p>
                      <span>Example: <code>3,1,2</code></span>
                    </article>

                    <article className="split-rule-card">
                      <code>Full list</code>
                      <strong>Every page once</strong>
                      <p>Include all pages from the PDF. Do not skip or repeat any number.</p>
                      <span>Example: <code>3,1,2,5,4</code></span>
                    </article>

                    <article className="split-rule-card">
                      <code>No ranges</code>
                      <strong>No <code>-</code> or <code>|</code></strong>
                      <p>Reorder Pages only accepts a full comma-separated list.</p>
                      <span>Example: <code>4,2,1,3</code></span>
                    </article>
                  </div>

                  <div className="split-help-steps" aria-label="Reorder pages steps">
                    <article className="split-help-step">
                      <strong>1. Decide the new first page</strong>
                      <p>If page 3 should come first, start the rule with <code>3</code>.</p>
                    </article>
                    <article className="split-help-step">
                      <strong>2. Continue the full new order</strong>
                      <p>For a 5-page PDF, <code>3,1,2,5,4</code> means page 3 becomes first and page 4 becomes last.</p>
                    </article>
                    <article className="split-help-step">
                      <strong>3. Preview and run the reorder</strong>
                      <p>The preview updates to show the typed order. Then click Start Reorder Pages and Download reordered PDF.</p>
                    </article>
                  </div>

                  <div className="split-example-list">
                    <div className="split-example-item">
                      <code>2,1,3,4</code>
                      <p>Swaps the first two pages only.</p>
                    </div>
                    <div className="split-example-item">
                      <code>3,1,2</code>
                      <p>Moves page 3 to the front in a 3-page PDF.</p>
                    </div>
                    <div className="split-example-item">
                      <code>5,4,3,2,1</code>
                      <p>Reverses the order of a 5-page PDF.</p>
                    </div>
                    <div className="split-example-item">
                      <code>4,1,2,3,5,6</code>
                      <p>Moves page 4 to the beginning while keeping the remaining pages in sequence.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tool.id === 'watermark-pdf' ? (
              <div className="control-grid">
                <label className="field field-wide">
                  <span>Watermark text</span>
                  <input
                    value={watermarkText}
                    onChange={(event) => setWatermarkText(event.target.value)}
                    placeholder="Confidential"
                  />
                </label>
              </div>
            ) : null}

            {tool.id === 'add-page-numbers' ? (
              <div className="control-grid">
                <label className="field">
                  <span>Position</span>
                  <select value={pagePosition} onChange={(event) => setPagePosition(event.target.value)}>
                    <option value="bottom-center">Bottom center</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="bottom-right">Bottom right</option>
                    <option value="top-left">Top left</option>
                    <option value="top-center">Top center</option>
                    <option value="top-right">Top right</option>
                  </select>
                </label>
                <label className="field">
                  <span>Prefix</span>
                  <input value={prefix} onChange={(event) => setPrefix(event.target.value)} placeholder="Page " />
                </label>
                <label className="field">
                  <span>Suffix</span>
                  <input value={suffix} onChange={(event) => setSuffix(event.target.value)} placeholder="" />
                </label>
              </div>
            ) : null}

            <div className="action-row">
              <button type="button" className="primary-button" onClick={primaryActionHandler} disabled={busy}>
                {primaryActionLabel}
              </button>
              <p className="helper-text">{helperCopy}</p>
            </div>

            {(busy || messageTone === 'success' || (messageTone === 'error' && processProgress > 0)) ? (
              <section
                className={`processing-progress-card processing-progress-card-${messageTone === 'success' ? 'success' : messageTone === 'error' ? 'error' : 'active'}`}
              >
                <div className="processing-progress-header">
                  <div className="processing-progress-copy">
                    <strong>{progressLabel}</strong>
                    <p>
                      {messageTone === 'success'
                        ? 'The file is ready. Use the main button above to download it.'
                        : messageTone === 'error'
                          ? 'Processing stopped before completion. Check the message below, then try again.'
                          : 'We are working on your file now. The percentage will move to 100% when processing completes.'}
                    </p>
                  </div>
                  <div className="processing-progress-value" aria-live="polite">
                    {String(progressValue).padStart(2, '0')}%
                  </div>
                </div>

                <div className="processing-progress-bar" aria-hidden="true">
                  <div
                    className="processing-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                  />
                </div>

                <div className="processing-progress-steps" aria-hidden="true">
                  <span className={progressValue >= 1 ? 'processing-progress-step processing-progress-step-active' : 'processing-progress-step'}>
                    Start
                  </span>
                  <span className={progressValue >= 35 ? 'processing-progress-step processing-progress-step-active' : 'processing-progress-step'}>
                    Processing
                  </span>
                  <span className={progressValue >= 100 ? 'processing-progress-step processing-progress-step-active' : 'processing-progress-step'}>
                    Download
                  </span>
                </div>
              </section>
            ) : null}

            <div className={`process-banner process-banner-${statusSummary.tone}`}>
              <div className="process-banner-icon" aria-hidden="true">
                {busy ? <span className="workflow-spinner" /> : statusSummary.tone === 'success' ? '✓' : statusSummary.tone === 'error' ? '!' : '+'}
              </div>
              <div className="process-banner-copy">
                <strong>{statusSummary.title}</strong>
                <p>{statusSummary.detail}</p>
              </div>
            </div>

            {tool.id === 'compress-pdf' && compressedPreviewFile ? (
              <SinglePdfPreviewCard
                file={compressedPreviewFile}
                title="Compressed PDF preview"
                description="Review the compressed result below, then download it when you are ready."
                status="Compressed"
              />
            ) : null}

            <div className="workflow-guide">
              <p className="eyebrow">Process Steps</p>
              <div className="workflow-steps" aria-label="How the tool workflow works">
                {workflowSteps.map((step) => (
                  <article key={step.id} className={`workflow-step workflow-step-${step.state}`}>
                    <div className="workflow-step-badge" aria-hidden="true">
                      {step.id === 'process' && busy ? <span className="workflow-spinner" /> : step.symbol}
                    </div>
                    <div className="workflow-step-copy">
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>Feature not enabled in this build</h3>
            <p>
              Password-protected PDF tools need a dedicated PDF security service. Keep them hidden in production until
              you add a tested backend flow.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
