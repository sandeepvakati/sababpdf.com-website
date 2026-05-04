'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  FileText,
  Highlighter,
  Image as ImageIcon,
  Info,
  Minus,
  MousePointer2,
  PenLine,
  Plus,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import BrandLogo from './BrandLogo';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const RENDER_SCALE = 1.6;
const MIN_BOX_SIZE = 0.015;
const DEFAULT_TEXT = 'New text';

const TOOLBAR_TOOLS = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'draw', label: 'Draw', icon: PenLine },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'line', label: 'Line', icon: Minus },
];

const COLOR_SWATCHES = ['#111827', '#ef312c', '#1387ff', '#16a34a', '#ffd43b', '#f59e0b', '#7c3aed'];
const DEFAULT_SHAPE_SIZE = {
  highlight: { w: 0.28, h: 0.045 },
  rect: { w: 0.18, h: 0.1 },
  circle: { w: 0.14, h: 0.1 },
};

function EditorHeader() {
  return (
    <header className="editpdf-app-header">
      <a className="editpdf-brand" href="/">
        <BrandLogo size={46} />
      </a>

      <nav className="editpdf-header-nav" aria-label="PDF tools">
        <a href="/merge-pdf">Merge PDF</a>
        <a href="/split-pdf">Split PDF</a>
        <a href="/compress-pdf">Compress PDF</a>
        <a href="/pdf-to-word">Convert PDF</a>
        <a href="/">All PDF Tools</a>
      </nav>

      <div className="editpdf-header-actions" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </header>
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgbColor(hex) {
  const safeHex = typeof hex === 'string' ? hex.replace('#', '') : '111827';
  const normalized = safeHex.length === 3
    ? safeHex.split('').map((char) => char + char).join('')
    : safeHex.padEnd(6, '0').slice(0, 6);

  return rgb(
    parseInt(normalized.slice(0, 2), 16) / 255,
    parseInt(normalized.slice(2, 4), 16) / 255,
    parseInt(normalized.slice(4, 6), 16) / 255
  );
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function rasterizeImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Unable to read image annotation.'));
    image.src = dataUrl;
  });
}

async function embedImageDataUrl(pdfDoc, dataUrl) {
  const mime = dataUrl.match(/^data:([^;]+);/i)?.[1]?.toLowerCase() || '';
  const bytes = dataUrlToBytes(dataUrl);

  if (mime.includes('png')) {
    return pdfDoc.embedPng(bytes);
  }

  if (mime.includes('jpg') || mime.includes('jpeg')) {
    return pdfDoc.embedJpg(bytes);
  }

  const pngDataUrl = await rasterizeImageDataUrl(dataUrl);
  return pdfDoc.embedPng(dataUrlToBytes(pngDataUrl));
}

function wrapText(text, font, fontSize, maxWidth) {
  const lines = [];
  const rawLines = String(text || '').split(/\r?\n/);

  rawLines.forEach((rawLine) => {
    if (!rawLine.trim()) {
      lines.push('');
      return;
    }

    let line = '';
    rawLine.split(/\s+/).forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    });

    if (line) {
      lines.push(line);
    }
  });

  return lines;
}

function getAnnotationName(annotation) {
  const names = {
    text: 'Text',
    image: 'Image',
    path: 'Freehand',
    highlight: 'Highlight',
    rect: 'Rectangle',
    circle: 'Circle',
    line: 'Line',
  };

  return `${names[annotation.type] || 'Item'} ${annotation.id}`;
}

export default function EditPdfILovePDF() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(85);
  const [activeColor, setActiveColor] = useState('#ef312c');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftShape, setDraftShape] = useState(null);
  const [draftPath, setDraftPath] = useState(null);

  const fileRef = useRef(null);
  const imageInputRef = useRef(null);
  const pageRefs = useRef([]);
  const scrollerRef = useRef(null);
  const nextAnnotationId = useRef(1);

  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedId) || null,
    [annotations, selectedId]
  );

  const currentPageAnnotations = useMemo(
    () => annotations.filter((annotation) => annotation.page === currentPage),
    [annotations, currentPage]
  );

  const createAnnotation = useCallback((annotation) => {
    const id = nextAnnotationId.current;
    nextAnnotationId.current += 1;

    const nextAnnotation = { id, ...annotation };
    setAnnotations((items) => [...items, nextAnnotation]);
    setRedoStack([]);
    setSelectedId(id);
    return nextAnnotation;
  }, []);

  const updateAnnotation = useCallback((id, updater) => {
    setAnnotations((items) => items.map((annotation) => {
      if (annotation.id !== id) {
        return annotation;
      }

      return typeof updater === 'function'
        ? { ...annotation, ...updater(annotation) }
        : { ...annotation, ...updater };
    }));
  }, []);

  const deleteAnnotation = useCallback((id) => {
    setAnnotations((items) => {
      const removed = items.find((annotation) => annotation.id === id);
      if (removed) {
        setRedoStack((stack) => [removed, ...stack]);
      }
      return items.filter((annotation) => annotation.id !== id);
    });
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const loadPdfPages = async (pdfFile) => {
    setLoading(true);
    setError('');

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const renderedPages = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const pdfViewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);

        await page.render({ canvasContext: context, viewport: renderViewport }).promise;

        renderedPages.push({
          pageNumber,
          src: canvas.toDataURL('image/png'),
          pdfWidth: pdfViewport.width,
          pdfHeight: pdfViewport.height,
        });
      }

      if (typeof pdf.destroy === 'function') {
        await pdf.destroy();
      }

      setPages(renderedPages);
      setAnnotations([]);
      setRedoStack([]);
      setSelectedId(null);
      setCurrentPage(0);
      setActiveTool('select');
      setZoom(85);
      nextAnnotationId.current = 1;
      pageRefs.current = [];
    } catch (err) {
      setError(`Failed to load PDF: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    if (rejectedFiles.length > 0) {
      setError('Please upload one valid PDF file under 100 MB.');
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) {
      return;
    }

    fileRef.current = selectedFile;
    setFile(selectedFile);
    loadPdfPages(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
  });

  useEffect(() => {
    if (!pages.length || !scrollerRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setCurrentPage(Number(visible.target.dataset.pageIndex));
        }
      },
      { root: scrollerRef.current, threshold: [0.35, 0.55, 0.75] }
    );

    pageRefs.current.filter(Boolean).forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pages]);

  const scrollToPage = (pageIndex) => {
    const pageNode = pageRefs.current[pageIndex];
    if (pageNode) {
      pageNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setCurrentPage(pageIndex);
  };

  const getPointOnPage = (event, pageIndex) => {
    const pageNode = pageRefs.current[pageIndex];
    if (!pageNode) {
      return { x: 0, y: 0 };
    }

    const rect = pageNode.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  };

  const getBoxFromPoints = (start, end) => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  });

  const createShapeFromGesture = (tool, pageIndex, start, end) => {
    const box = getBoxFromPoints(start, end);

    if (tool === 'line') {
      const hasLineSize = Math.hypot(end.x - start.x, end.y - start.y) > 0.01;
      const lineStart = hasLineSize ? start : { x: clamp(start.x - 0.1, 0, 1), y: start.y };
      const lineEnd = hasLineSize ? end : { x: clamp(start.x + 0.1, 0, 1), y: start.y };

      createAnnotation({
        page: pageIndex,
        type: 'line',
        points: [lineStart, lineEnd],
        color: activeColor,
        strokeWidth: activeStrokeWidth,
        opacity: 1,
      });
      return;
    }

    const hasBoxSize = box.w > MIN_BOX_SIZE && box.h > MIN_BOX_SIZE;
    const fallbackSize = DEFAULT_SHAPE_SIZE[tool] || DEFAULT_SHAPE_SIZE.rect;
    const finalBox = hasBoxSize
      ? box
      : {
        x: clamp(start.x - fallbackSize.w / 2, 0, 1 - fallbackSize.w),
        y: clamp(start.y - fallbackSize.h / 2, 0, 1 - fallbackSize.h),
        w: fallbackSize.w,
        h: fallbackSize.h,
      };

    createAnnotation({
      page: pageIndex,
      type: tool,
      ...finalBox,
      fill: activeColor,
      stroke: activeColor,
      strokeWidth: tool === 'highlight' ? 0 : activeStrokeWidth,
      opacity: tool === 'highlight' ? 0.38 : 0.18,
    });
  };

  const placeText = (point, pageIndex) => {
    const page = pages[pageIndex];
    const w = clamp(230 / page.pdfWidth, 0.18, 0.46);
    const h = clamp(58 / page.pdfHeight, 0.05, 0.16);

    createAnnotation({
      page: pageIndex,
      type: 'text',
      x: clamp(point.x - w / 2, 0, 1 - w),
      y: clamp(point.y - h / 2, 0, 1 - h),
      w,
      h,
      text: DEFAULT_TEXT,
      fontSize: 18,
      color: '#111827',
      bold: false,
      italic: false,
    });
  };

  const handleImageFile = (imageFile) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;
      const image = new Image();

      image.onload = () => {
        const page = pages[currentPage];
        const aspect = image.naturalWidth / Math.max(image.naturalHeight, 1);
        const imageWidth = Math.min(page.pdfWidth * 0.36, 260);
        const imageHeight = imageWidth / Math.max(aspect, 0.1);
        const w = clamp(imageWidth / page.pdfWidth, 0.08, 0.5);
        const h = clamp(imageHeight / page.pdfHeight, 0.05, 0.45);

        createAnnotation({
          page: currentPage,
          type: 'image',
          x: clamp(0.5 - w / 2, 0, 1 - w),
          y: clamp(0.5 - h / 2, 0, 1 - h),
          w,
          h,
          src: dataUrl,
          opacity: 1,
        });
      };

      image.onerror = () => setError('Could not load that image.');
      image.src = dataUrl;
    };

    reader.readAsDataURL(imageFile);
  };

  const handleImageInput = (event) => {
    const imageFile = event.target.files?.[0];
    if (imageFile) {
      handleImageFile(imageFile);
    }
    event.target.value = '';
    setActiveTool('select');
  };

  const handlePagePointerDown = (event, pageIndex) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    setCurrentPage(pageIndex);
    setSelectedId(null);

    const point = getPointOnPage(event, pageIndex);

    if (activeTool === 'select') {
      return;
    }

    if (activeTool === 'text') {
      placeText(point, pageIndex);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'image') {
      imageInputRef.current?.click();
      return;
    }

    if (activeTool === 'draw') {
      const points = [point];
      setDraftPath({ page: pageIndex, points });

      const handlePointerMove = (moveEvent) => {
        const nextPoint = getPointOnPage(moveEvent, pageIndex);
        const last = points[points.length - 1];
        const distance = Math.hypot(nextPoint.x - last.x, nextPoint.y - last.y);
        if (distance < 0.004) {
          return;
        }

        points.push(nextPoint);
        setDraftPath({ page: pageIndex, points: [...points] });
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);

        if (points.length > 1) {
          createAnnotation({
            page: pageIndex,
            type: 'path',
            points: [...points],
            color: activeColor,
            strokeWidth: activeStrokeWidth,
            opacity: 1,
          });
        }

        setDraftPath(null);
        setActiveTool('select');
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      return;
    }

    if (['highlight', 'rect', 'circle', 'line'].includes(activeTool)) {
      const tool = activeTool;
      let latestPoint = point;
      setDraftShape({ page: pageIndex, type: tool, start: point, end: point });

      const handlePointerMove = (moveEvent) => {
        latestPoint = getPointOnPage(moveEvent, pageIndex);
        setDraftShape({ page: pageIndex, type: tool, start: point, end: latestPoint });
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);

        createShapeFromGesture(tool, pageIndex, point, latestPoint);
        setDraftShape(null);
        setActiveTool('select');
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
  };

  const handlePagePointerMove = (event, pageIndex) => {
    if (draftPath && draftPath.page === pageIndex) {
      const point = getPointOnPage(event, pageIndex);
      setDraftPath((path) => {
        const last = path.points[path.points.length - 1];
        const distance = Math.hypot(point.x - last.x, point.y - last.y);
        if (distance < 0.004) {
          return path;
        }
        return { ...path, points: [...path.points, point] };
      });
      return;
    }

    if (draftShape && draftShape.page === pageIndex) {
      setDraftShape((shape) => ({ ...shape, end: getPointOnPage(event, pageIndex) }));
    }
  };

  const handlePagePointerUp = (event, pageIndex) => {
    if (draftPath && draftPath.page === pageIndex) {
      if (draftPath.points.length > 1) {
        createAnnotation({
          page: pageIndex,
          type: 'path',
          points: draftPath.points,
          color: '#ef312c',
          strokeWidth: 3,
          opacity: 1,
        });
      }
      setDraftPath(null);
      setActiveTool('select');
      return;
    }

    if (!draftShape || draftShape.page !== pageIndex) {
      return;
    }

    const box = getBoxFromPoints(draftShape.start, draftShape.end);
    const isLine = draftShape.type === 'line';
    const hasSize = isLine
      ? Math.hypot(draftShape.end.x - draftShape.start.x, draftShape.end.y - draftShape.start.y) > 0.01
      : box.w > MIN_BOX_SIZE && box.h > MIN_BOX_SIZE;

    if (hasSize) {
      if (isLine) {
        createAnnotation({
          page: pageIndex,
          type: 'line',
          points: [draftShape.start, draftShape.end],
          color: '#111827',
          strokeWidth: 2,
          opacity: 1,
        });
      } else {
        createAnnotation({
          page: pageIndex,
          type: draftShape.type,
          ...box,
          fill: draftShape.type === 'highlight' ? '#ffd43b' : '#1387ff',
          stroke: draftShape.type === 'highlight' ? '#ffd43b' : '#111827',
          strokeWidth: draftShape.type === 'highlight' ? 0 : 2,
          opacity: draftShape.type === 'highlight' ? 0.42 : 0.18,
        });
      }
    }

    setDraftShape(null);
    setActiveTool('select');
  };

  const handleAnnotationPointerDown = (event, annotation) => {
    event.stopPropagation();
    setSelectedId(annotation.id);

    if (!['text', 'image', 'rect', 'circle', 'highlight'].includes(annotation.type)) {
      return;
    }

    const start = getPointOnPage(event, annotation.page);
    const original = { x: annotation.x, y: annotation.y };

    const onPointerMove = (moveEvent) => {
      const point = getPointOnPage(moveEvent, annotation.page);
      const dx = point.x - start.x;
      const dy = point.y - start.y;

      updateAnnotation(annotation.id, (current) => ({
        x: clamp(original.x + dx, 0, 1 - current.w),
        y: clamp(original.y + dy, 0, 1 - current.h),
      }));
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const handleResizePointerDown = (event, annotation) => {
    event.stopPropagation();
    setSelectedId(annotation.id);

    const start = getPointOnPage(event, annotation.page);
    const original = { w: annotation.w, h: annotation.h };

    const onPointerMove = (moveEvent) => {
      const point = getPointOnPage(moveEvent, annotation.page);
      const dx = point.x - start.x;
      const dy = point.y - start.y;

      updateAnnotation(annotation.id, (current) => ({
        w: clamp(original.w + dx, MIN_BOX_SIZE, 1 - current.x),
        h: clamp(original.h + dy, MIN_BOX_SIZE, 1 - current.y),
      }));
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const handleUndo = () => {
    setAnnotations((items) => {
      if (!items.length) {
        return items;
      }

      const removed = items[items.length - 1];
      setRedoStack((stack) => [removed, ...stack]);
      setSelectedId((current) => (current === removed.id ? null : current));
      return items.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack((stack) => {
      if (!stack.length) {
        return stack;
      }

      const [restored, ...rest] = stack;
      setAnnotations((items) => [...items, restored]);
      setSelectedId(restored.id);
      return rest;
    });
  };

  const clearCurrentPage = () => {
    setAnnotations((items) => items.filter((annotation) => annotation.page !== currentPage));
    setSelectedId(null);
  };

  const clearAll = () => {
    setAnnotations([]);
    setRedoStack([]);
    setSelectedId(null);
  };

  const downloadPdf = async () => {
    if (!fileRef.current || saving) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const arrayBuffer = await fileRef.current.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
      const pdfPages = pdfDoc.getPages();

      for (const annotation of annotations) {
        const page = pdfPages[annotation.page];
        if (!page) {
          continue;
        }

        const { width, height } = page.getSize();

        if (annotation.type === 'text') {
          const font = annotation.bold && annotation.italic
            ? boldItalicFont
            : annotation.bold
              ? boldFont
              : annotation.italic
                ? italicFont
                : regularFont;
          const fontSize = annotation.fontSize || 18;
          const x = annotation.x * width;
          const boxWidth = annotation.w * width;
          const boxHeight = annotation.h * height;
          const topY = annotation.y * height;
          const lineHeight = fontSize * 1.22;
          const lines = wrapText(annotation.text, font, fontSize, Math.max(boxWidth, fontSize * 2));
          const maxLines = Math.max(1, Math.floor(boxHeight / lineHeight));
          let y = height - topY - fontSize;

          lines.slice(0, maxLines).forEach((line) => {
            page.drawText(line || ' ', {
              x,
              y,
              size: fontSize,
              font,
              color: hexToRgbColor(annotation.color),
              maxWidth: boxWidth,
              lineHeight,
            });
            y -= lineHeight;
          });
        }

        if (annotation.type === 'image' && annotation.src) {
          const embeddedImage = await embedImageDataUrl(pdfDoc, annotation.src);
          const drawWidth = annotation.w * width;
          const drawHeight = annotation.h * height;
          page.drawImage(embeddedImage, {
            x: annotation.x * width,
            y: height - annotation.y * height - drawHeight,
            width: drawWidth,
            height: drawHeight,
            opacity: annotation.opacity ?? 1,
          });
        }

        if (['rect', 'highlight'].includes(annotation.type)) {
          const drawWidth = annotation.w * width;
          const drawHeight = annotation.h * height;
          page.drawRectangle({
            x: annotation.x * width,
            y: height - annotation.y * height - drawHeight,
            width: drawWidth,
            height: drawHeight,
            color: hexToRgbColor(annotation.fill),
            opacity: annotation.opacity ?? 0.2,
            borderColor: hexToRgbColor(annotation.stroke || annotation.fill),
            borderWidth: annotation.strokeWidth || 0,
          });
        }

        if (annotation.type === 'circle') {
          const drawWidth = annotation.w * width;
          const drawHeight = annotation.h * height;
          page.drawEllipse({
            x: annotation.x * width + drawWidth / 2,
            y: height - annotation.y * height - drawHeight / 2,
            xScale: drawWidth / 2,
            yScale: drawHeight / 2,
            color: hexToRgbColor(annotation.fill),
            opacity: annotation.opacity ?? 0.2,
            borderColor: hexToRgbColor(annotation.stroke || '#111827'),
            borderWidth: annotation.strokeWidth || 2,
          });
        }

        if (annotation.type === 'line' && annotation.points?.length === 2) {
          const [start, end] = annotation.points;
          page.drawLine({
            start: { x: start.x * width, y: height - start.y * height },
            end: { x: end.x * width, y: height - end.y * height },
            thickness: annotation.strokeWidth || 2,
            color: hexToRgbColor(annotation.color),
            opacity: annotation.opacity ?? 1,
          });
        }

        if (annotation.type === 'path' && annotation.points?.length > 1) {
          for (let index = 1; index < annotation.points.length; index += 1) {
            const start = annotation.points[index - 1];
            const end = annotation.points[index];
            page.drawLine({
              start: { x: start.x * width, y: height - start.y * height },
              end: { x: end.x * width, y: height - end.y * height },
              thickness: annotation.strokeWidth || 3,
              color: hexToRgbColor(annotation.color),
              opacity: annotation.opacity ?? 1,
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const baseName = fileRef.current.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${baseName || 'document'}-edited.pdf`);
    } catch (err) {
      setError(`Failed to save PDF: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderAnnotation = (annotation, page) => {
    const isSelected = annotation.id === selectedId;

    if (annotation.type === 'path' || annotation.type === 'line') {
      const points = annotation.points || [];
      const pointList = points
        .map((point) => `${point.x * page.pdfWidth * (zoom / 100)},${point.y * page.pdfHeight * (zoom / 100)}`)
        .join(' ');

      return (
        <svg
          key={annotation.id}
          className={`editpdf-vector-ann ${isSelected ? 'selected' : ''}`}
          width="100%"
          height="100%"
          viewBox={`0 0 ${page.pdfWidth * (zoom / 100)} ${page.pdfHeight * (zoom / 100)}`}
          onPointerDown={(event) => {
            event.stopPropagation();
            setSelectedId(annotation.id);
          }}
        >
          {annotation.type === 'line' && points.length === 2 ? (
            <line
              x1={points[0].x * page.pdfWidth * (zoom / 100)}
              y1={points[0].y * page.pdfHeight * (zoom / 100)}
              x2={points[1].x * page.pdfWidth * (zoom / 100)}
              y2={points[1].y * page.pdfHeight * (zoom / 100)}
              stroke={annotation.color}
              strokeWidth={(annotation.strokeWidth || 2) * (zoom / 100)}
              strokeLinecap="round"
              opacity={annotation.opacity ?? 1}
              onPointerDown={(event) => {
                event.stopPropagation();
                setSelectedId(annotation.id);
              }}
            />
          ) : (
            <polyline
              points={pointList}
              fill="none"
              stroke={annotation.color}
              strokeWidth={(annotation.strokeWidth || 3) * (zoom / 100)}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={annotation.opacity ?? 1}
              onPointerDown={(event) => {
                event.stopPropagation();
                setSelectedId(annotation.id);
              }}
            />
          )}
        </svg>
      );
    }

    const style = {
      left: `${annotation.x * 100}%`,
      top: `${annotation.y * 100}%`,
      width: `${annotation.w * 100}%`,
      height: `${annotation.h * 100}%`,
    };

    if (annotation.type === 'text') {
      return (
        <div
          key={annotation.id}
          className={`editpdf-ann editpdf-ann-text ${isSelected ? 'selected' : ''}`}
          style={{
            ...style,
            color: annotation.color,
            fontSize: `${(annotation.fontSize || 18) * (zoom / 100)}px`,
            fontWeight: annotation.bold ? 800 : 500,
            fontStyle: annotation.italic ? 'italic' : 'normal',
          }}
          onPointerDown={(event) => handleAnnotationPointerDown(event, annotation)}
        >
          <textarea
            className="editpdf-ann-text-content"
            value={annotation.text}
            spellCheck={false}
            dir="ltr"
            onChange={(event) => updateAnnotation(annotation.id, { text: event.target.value })}
            onPointerDown={(event) => {
              event.stopPropagation();
              setSelectedId(annotation.id);
            }}
          />
          {isSelected ? (
            <>
              <button type="button" className="editpdf-ann-delete" onClick={() => deleteAnnotation(annotation.id)} aria-label="Delete item">
                <X size={12} />
              </button>
              <span className="editpdf-ann-resize" onPointerDown={(event) => handleResizePointerDown(event, annotation)} />
            </>
          ) : null}
        </div>
      );
    }

    if (annotation.type === 'image') {
      return (
        <div
          key={annotation.id}
          className={`editpdf-ann editpdf-ann-image ${isSelected ? 'selected' : ''}`}
          style={{ ...style, opacity: annotation.opacity ?? 1 }}
          onPointerDown={(event) => handleAnnotationPointerDown(event, annotation)}
        >
          <img src={annotation.src} alt="" draggable={false} />
          {isSelected ? (
            <>
              <button type="button" className="editpdf-ann-delete" onClick={() => deleteAnnotation(annotation.id)} aria-label="Delete item">
                <X size={12} />
              </button>
              <span className="editpdf-ann-resize" onPointerDown={(event) => handleResizePointerDown(event, annotation)} />
            </>
          ) : null}
        </div>
      );
    }

    return (
      <div
        key={annotation.id}
        className={`editpdf-ann editpdf-ann-shape ${isSelected ? 'selected' : ''}`}
        style={{
          ...style,
          background: annotation.fill,
          border: `${(annotation.strokeWidth || 0) * (zoom / 100)}px solid ${annotation.stroke}`,
          borderRadius: annotation.type === 'circle' ? '50%' : '3px',
          opacity: annotation.opacity ?? 0.2,
        }}
        onPointerDown={(event) => handleAnnotationPointerDown(event, annotation)}
      >
        {isSelected ? (
          <>
            <button type="button" className="editpdf-ann-delete" onClick={() => deleteAnnotation(annotation.id)} aria-label="Delete item">
              <X size={12} />
            </button>
            <span className="editpdf-ann-resize" onPointerDown={(event) => handleResizePointerDown(event, annotation)} />
          </>
        ) : null}
      </div>
    );
  };

  const renderDraft = (pageIndex, page) => {
    if (draftPath && draftPath.page === pageIndex) {
      const pointList = draftPath.points
        .map((point) => `${point.x * page.pdfWidth * (zoom / 100)},${point.y * page.pdfHeight * (zoom / 100)}`)
        .join(' ');

      return (
        <svg className="editpdf-draft-vector" width="100%" height="100%" viewBox={`0 0 ${page.pdfWidth * (zoom / 100)} ${page.pdfHeight * (zoom / 100)}`}>
          <polyline points={pointList} fill="none" stroke="#ef312c" strokeWidth={3 * (zoom / 100)} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (!draftShape || draftShape.page !== pageIndex) {
      return null;
    }

    if (draftShape.type === 'line') {
      return (
        <svg className="editpdf-draft-vector" width="100%" height="100%" viewBox={`0 0 ${page.pdfWidth * (zoom / 100)} ${page.pdfHeight * (zoom / 100)}`}>
          <line
            x1={draftShape.start.x * page.pdfWidth * (zoom / 100)}
            y1={draftShape.start.y * page.pdfHeight * (zoom / 100)}
            x2={draftShape.end.x * page.pdfWidth * (zoom / 100)}
            y2={draftShape.end.y * page.pdfHeight * (zoom / 100)}
            stroke="#111827"
            strokeWidth={2 * (zoom / 100)}
            strokeLinecap="round"
          />
        </svg>
      );
    }

    const box = getBoxFromPoints(draftShape.start, draftShape.end);

    return (
      <div
        className="editpdf-draft-shape"
        style={{
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
          borderRadius: draftShape.type === 'circle' ? '50%' : '3px',
          background: draftShape.type === 'highlight' ? 'rgba(255, 212, 59, 0.4)' : 'rgba(19, 135, 255, 0.16)',
        }}
      />
    );
  };

  if (!file) {
    return (
      <div className="editpdf-page">
        <EditorHeader />

        <main className="editpdf-upload-stage">
          <section className="editpdf-upload-copy">
            <h1>Edit PDF</h1>
            <p>Add text, images, shapes, highlights, and freehand annotations to your PDF in the browser.</p>
          </section>

          <section
            {...getRootProps()}
            className={`editpdf-uploader ${isDragActive ? 'editpdf-uploader-active' : ''}`}
          >
            <input {...getInputProps()} />
            <FileText size={58} strokeWidth={1.6} />
            <button type="button" className="editpdf-upload-btn" onClick={open}>
              Select PDF file
            </button>
            <p>or drop PDF here</p>
          </section>

          {error ? (
            <p className="editpdf-error">
              <X size={16} /> {error}
            </p>
          ) : null}
        </main>

        <style jsx>{editPdfStyles}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="editpdf-page editpdf-editor-open">
        <EditorHeader />
        <main className="editpdf-loading">
          <div className="editpdf-spinner" />
          <p>Loading PDF...</p>
        </main>
        <style jsx>{editPdfStyles}</style>
      </div>
    );
  }

  return (
    <div className="editpdf-page editpdf-editor-open">
      <EditorHeader />

      <div className="editpdf-workbench">
        <div className="editpdf-toolbar">
          <div className="editpdf-tool-strip" role="toolbar" aria-label="Edit PDF tools">
            {TOOLBAR_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  className={`editpdf-tool-button ${activeTool === tool.id ? 'active' : ''}`}
                  onClick={() => {
                    if (tool.id === 'image') {
                      setActiveTool('image');
                      imageInputRef.current?.click();
                    } else {
                      setActiveTool((current) => (current === tool.id && tool.id !== 'select' ? 'select' : tool.id));
                    }
                  }}
                  title={tool.label}
                  aria-label={tool.label}
                >
                  <Icon size={18} />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>

          <div className="editpdf-quick-style" aria-label="Drawing style">
            <span className="editpdf-quick-label">Color</span>
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                className={`editpdf-quick-swatch ${activeColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => {
                  setActiveColor(color);
                  if (selectedAnnotation?.type === 'text') {
                    updateAnnotation(selectedAnnotation.id, { color });
                  } else if (selectedAnnotation && ['line', 'path'].includes(selectedAnnotation.type)) {
                    updateAnnotation(selectedAnnotation.id, { color });
                  } else if (selectedAnnotation && ['rect', 'circle', 'highlight'].includes(selectedAnnotation.type)) {
                    updateAnnotation(selectedAnnotation.id, { fill: color, stroke: color });
                  }
                }}
                aria-label={`Use ${color}`}
                title={color}
              />
            ))}
            <label className="editpdf-quick-width">
              <span>Width</span>
              <input
                type="number"
                min="1"
                max="20"
                value={activeStrokeWidth}
                onChange={(event) => {
                  const nextWidth = clamp(Number(event.target.value) || 1, 1, 20);
                  setActiveStrokeWidth(nextWidth);
                  if (selectedAnnotation && ['line', 'path', 'rect', 'circle'].includes(selectedAnnotation.type)) {
                    updateAnnotation(selectedAnnotation.id, { strokeWidth: nextWidth });
                  }
                }}
              />
            </label>
          </div>

          <div className="editpdf-toolbar-actions">
            <button type="button" onClick={handleUndo} disabled={!annotations.length} title="Undo" aria-label="Undo">
              <Undo2 size={18} />
            </button>
            <button type="button" onClick={handleRedo} disabled={!redoStack.length} title="Redo" aria-label="Redo">
              <Redo2 size={18} />
            </button>
            <span className="editpdf-toolbar-rule" />
            <button type="button" onClick={() => setZoom((value) => Math.max(45, value - 10))} title="Zoom out" aria-label="Zoom out">
              <ZoomOut size={18} />
            </button>
            <span className="editpdf-zoom-value">{zoom}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(180, value + 10))} title="Zoom in" aria-label="Zoom in">
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        <div className="editpdf-editor-body">
          <aside className="editpdf-left-panel">
            <div className="editpdf-panel-title">Pages</div>
            <div className="editpdf-thumbnails">
              {pages.map((page, index) => (
                <button
                  type="button"
                  key={page.pageNumber}
                  className={`editpdf-thumbnail ${index === currentPage ? 'active' : ''}`}
                  onClick={() => scrollToPage(index)}
                >
                  <span className="editpdf-thumb-frame">
                    <img src={page.src} alt={`Page ${index + 1}`} />
                  </span>
                  <span className="editpdf-page-num">{index + 1}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="editpdf-canvas-area">
            <input ref={imageInputRef} type="file" accept="image/*" className="editpdf-hidden-input" onChange={handleImageInput} />

            <div className="editpdf-canvas-scroller" ref={scrollerRef}>
              {pages.map((page, index) => {
                const pageWidth = page.pdfWidth * (zoom / 100);
                const pageHeight = page.pdfHeight * (zoom / 100);

                return (
                  <section
                    key={page.pageNumber}
                    ref={(node) => {
                      pageRefs.current[index] = node;
                    }}
                    data-page-index={index}
                    className="editpdf-page-block"
                    style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                  >
                    <img src={page.src} alt={`Page ${index + 1}`} className="editpdf-page-img" draggable={false} />
                    <div
                      className="editpdf-page-overlay"
                      onPointerDown={(event) => handlePagePointerDown(event, index)}
                      style={{
                        cursor: activeTool === 'select' ? 'default' : activeTool === 'text' ? 'text' : activeTool === 'image' ? 'copy' : 'crosshair',
                      }}
                    >
                      {annotations
                        .filter((annotation) => annotation.page === index)
                        .map((annotation) => renderAnnotation(annotation, page))}
                      {renderDraft(index, page)}
                    </div>
                    <span className="editpdf-page-badge">Page {index + 1}</span>
                  </section>
                );
              })}
            </div>

            <div className="editpdf-bottom-controls">
              <button type="button" onClick={() => scrollToPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} aria-label="Previous page">
                <ChevronLeft size={18} />
              </button>
              <span className="editpdf-page-control">{currentPage + 1}</span>
              <span className="editpdf-total-control">/ {pages.length}</span>
              <button type="button" onClick={() => scrollToPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage === pages.length - 1} aria-label="Next page">
                <ChevronRight size={18} />
              </button>
            </div>
          </main>

          <aside className="editpdf-right-panel">
            <div className="editpdf-style-panel">
              <h2>Edit PDF</h2>
              <p className="editpdf-info-note">
                <Info size={16} />
                Add objects on top of the PDF. Drag items on the page, resize from the corner, then save.
              </p>

              <div className="editpdf-panel-rule" />

              <div className="editpdf-selection-header">
                <h3>Page {currentPage + 1}</h3>
                <span>{currentPageAnnotations.length} items</span>
              </div>

              {currentPageAnnotations.length ? (
                <div className="editpdf-items-list">
                  {[...currentPageAnnotations].reverse().map((annotation) => (
                    <button
                      type="button"
                      key={annotation.id}
                      className={`editpdf-item-row ${selectedId === annotation.id ? 'selected' : ''}`}
                      onClick={() => setSelectedId(annotation.id)}
                    >
                      <span>{getAnnotationName(annotation)}</span>
                      <Trash2
                        size={15}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteAnnotation(annotation.id);
                        }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="editpdf-empty-layer">No edits on this page yet.</div>
              )}

              <div className="editpdf-panel-rule" />

              {selectedAnnotation ? (
                <div className="editpdf-properties">
                  <h3>Selected item</h3>

                  {selectedAnnotation.type === 'text' ? (
                    <>
                      <label>
                        Text
                        <textarea
                          value={selectedAnnotation.text}
                          onChange={(event) => updateAnnotation(selectedAnnotation.id, { text: event.target.value })}
                        />
                      </label>
                      <div className="editpdf-two-cols">
                        <label>
                          Size
                          <input
                            type="number"
                            min="8"
                            max="96"
                            value={selectedAnnotation.fontSize}
                            onChange={(event) => updateAnnotation(selectedAnnotation.id, { fontSize: Number(event.target.value) || 18 })}
                          />
                        </label>
                        <label>
                          Color
                          <input
                            type="color"
                            value={selectedAnnotation.color}
                            onChange={(event) => updateAnnotation(selectedAnnotation.id, { color: event.target.value })}
                          />
                        </label>
                      </div>
                      <div className="editpdf-toggle-row">
                        <button
                          type="button"
                          className={selectedAnnotation.bold ? 'active' : ''}
                          onClick={() => updateAnnotation(selectedAnnotation.id, { bold: !selectedAnnotation.bold })}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          className={selectedAnnotation.italic ? 'active' : ''}
                          onClick={() => updateAnnotation(selectedAnnotation.id, { italic: !selectedAnnotation.italic })}
                        >
                          I
                        </button>
                      </div>
                    </>
                  ) : null}

                  {['rect', 'circle', 'highlight'].includes(selectedAnnotation.type) ? (
                    <>
                      <div className="editpdf-two-cols">
                        <label>
                          Fill
                          <input
                            type="color"
                            value={selectedAnnotation.fill}
                            onChange={(event) => updateAnnotation(selectedAnnotation.id, { fill: event.target.value })}
                          />
                        </label>
                        <label>
                          Border
                          <input
                            type="color"
                            value={selectedAnnotation.stroke}
                            onChange={(event) => updateAnnotation(selectedAnnotation.id, { stroke: event.target.value })}
                          />
                        </label>
                      </div>
                      <label>
                        Opacity
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={selectedAnnotation.opacity}
                          onChange={(event) => updateAnnotation(selectedAnnotation.id, { opacity: Number(event.target.value) })}
                        />
                      </label>
                    </>
                  ) : null}

                  {['line', 'path'].includes(selectedAnnotation.type) ? (
                    <div className="editpdf-two-cols">
                      <label>
                        Color
                        <input
                          type="color"
                          value={selectedAnnotation.color}
                          onChange={(event) => updateAnnotation(selectedAnnotation.id, { color: event.target.value })}
                        />
                      </label>
                      <label>
                        Width
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={selectedAnnotation.strokeWidth}
                          onChange={(event) => updateAnnotation(selectedAnnotation.id, { strokeWidth: Number(event.target.value) || 2 })}
                        />
                      </label>
                    </div>
                  ) : null}

                  {selectedAnnotation.type === 'image' ? (
                    <label>
                      Opacity
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={selectedAnnotation.opacity}
                        onChange={(event) => updateAnnotation(selectedAnnotation.id, { opacity: Number(event.target.value) })}
                      />
                    </label>
                  ) : null}

                  <div className="editpdf-color-palette" aria-label="Quick colors">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        style={{ background: color }}
                        onClick={() => {
                          if (selectedAnnotation.type === 'text') {
                            updateAnnotation(selectedAnnotation.id, { color });
                          } else if (['line', 'path'].includes(selectedAnnotation.type)) {
                            updateAnnotation(selectedAnnotation.id, { color });
                          } else if (['rect', 'circle', 'highlight'].includes(selectedAnnotation.type)) {
                            updateAnnotation(selectedAnnotation.id, { fill: color });
                          }
                        }}
                        aria-label={`Use ${color}`}
                      />
                    ))}
                  </div>

                  <button type="button" className="editpdf-delete-selected" onClick={() => deleteAnnotation(selectedAnnotation.id)}>
                    <Trash2 size={16} />
                    Delete selected
                  </button>
                </div>
              ) : (
                <div className="editpdf-properties-empty">
                  Select an item to adjust its text, colors, opacity, or size.
                </div>
              )}
            </div>

            {error ? (
              <p className="editpdf-save-error">
                <X size={15} /> {error}
              </p>
            ) : null}

            <div className="editpdf-save-zone">
              <div className="editpdf-clean-actions">
                <button type="button" onClick={clearCurrentPage} disabled={!currentPageAnnotations.length}>
                  Clear page
                </button>
                <button type="button" onClick={clearAll} disabled={!annotations.length}>
                  Clear all
                </button>
              </div>
              <button className="editpdf-save-btn" type="button" onClick={downloadPdf} disabled={saving}>
                <Download size={22} />
                {saving ? 'Saving...' : 'Save changes'}
                <ChevronRight size={24} />
              </button>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{editPdfStyles}</style>
    </div>
  );
}

const editPdfStyles = `
  .editpdf-page {
    min-height: 100vh;
    background: #f3f4f8;
    color: #232936;
    font-family: Arial, Helvetica, sans-serif;
  }

  html[data-theme='dark'] .editpdf-page {
    background: #0f141d;
    color: #f5f7fb;
  }

  .editpdf-editor-open {
    height: 100vh;
    overflow: hidden;
  }

  .editpdf-app-header {
    height: 68px;
    padding: 0 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    background: #ffffff;
    border-bottom: 1px solid #d7dbe4;
    color: #10131a;
  }

  html[data-theme='dark'] .editpdf-app-header {
    background: #101823;
    border-bottom-color: rgba(255, 193, 117, 0.14);
    color: #f5f7fb;
  }

  .editpdf-brand {
    display: inline-flex;
    align-items: center;
    min-width: 168px;
    text-decoration: none;
    color: inherit;
  }

  .editpdf-brand :global(.brand-logo-image) {
    width: 46px !important;
    height: 46px !important;
    filter: none;
  }

  .editpdf-brand :global(.brand-text) {
    font-size: 1.55rem;
    font-weight: 900;
    letter-spacing: 0;
  }

  .editpdf-header-nav {
    display: flex;
    align-items: center;
    gap: clamp(18px, 3.2vw, 52px);
    flex: 1;
    min-width: 0;
    overflow: auto;
    scrollbar-width: none;
  }

  .editpdf-header-nav::-webkit-scrollbar {
    display: none;
  }

  .editpdf-header-nav a {
    color: #0b0f19;
    font-size: 0.96rem;
    font-weight: 800;
    text-decoration: none;
    text-transform: uppercase;
    white-space: nowrap;
  }

  html[data-theme='dark'] .editpdf-header-nav a {
    color: #f5f7fb;
  }

  .editpdf-header-actions {
    width: 34px;
    height: 34px;
    display: grid;
    grid-template-columns: repeat(3, 4px);
    grid-auto-rows: 4px;
    gap: 6px;
    align-content: center;
    justify-content: center;
  }

  .editpdf-header-actions span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #30333b;
  }

  html[data-theme='dark'] .editpdf-header-actions span {
    background: #aeb8c8;
  }

  .editpdf-upload-stage,
  .editpdf-loading {
    min-height: calc(100vh - 68px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 42px 18px;
    text-align: center;
  }

  .editpdf-upload-copy {
    display: grid;
    gap: 10px;
    max-width: 760px;
  }

  .editpdf-upload-copy h1 {
    margin: 0;
    font-size: clamp(2.2rem, 5vw, 4rem);
    line-height: 1;
    color: #ef312c;
  }

  .editpdf-upload-copy p {
    margin: 0;
    color: #5c6472;
    font-size: 1.08rem;
    line-height: 1.6;
  }

  html[data-theme='dark'] .editpdf-upload-copy p {
    color: #aeb8c8;
  }

  .editpdf-uploader {
    width: min(720px, 100%);
    min-height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 34px;
    background: #ffffff;
    border: 2px dashed #c9ced8;
    border-radius: 8px;
    color: #747b87;
    box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
  }

  html[data-theme='dark'] .editpdf-uploader {
    background: #131b28;
    border-color: rgba(255, 193, 117, 0.22);
    color: #aeb8c8;
    box-shadow: 0 18px 46px rgba(0, 0, 0, 0.3);
  }

  .editpdf-uploader-active {
    border-color: #ef312c;
    background: #fff7f7;
  }

  .editpdf-upload-btn {
    border: 0;
    border-radius: 8px;
    background: #ef312c;
    color: #ffffff;
    padding: 18px 46px;
    font-size: 1.35rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 14px 30px rgba(239, 49, 44, 0.24);
  }

  .editpdf-uploader p,
  .editpdf-error,
  .editpdf-save-error {
    margin: 0;
  }

  .editpdf-error,
  .editpdf-save-error {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    color: #b42318;
    background: #fff1f1;
    border: 1px solid #f6b6b6;
    padding: 10px 12px;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .editpdf-spinner {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 5px solid #e2e6ee;
    border-top-color: #ef312c;
    animation: editpdf-spin 0.8s linear infinite;
  }

  .editpdf-loading p {
    margin: 0;
    color: #5c6472;
    font-size: 1rem;
    font-weight: 800;
  }

  @keyframes editpdf-spin {
    to { transform: rotate(360deg); }
  }

  .editpdf-workbench {
    height: calc(100vh - 68px);
    display: flex;
    flex-direction: column;
    background: #f3f4f8;
  }

  .editpdf-toolbar {
    min-height: 58px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 9px 14px;
    background: #ffffff;
    border-bottom: 1px solid #d5dae4;
  }

  html[data-theme='dark'] .editpdf-toolbar {
    background: #101823;
    border-bottom-color: rgba(255, 193, 117, 0.14);
  }

  .editpdf-tool-strip,
  .editpdf-quick-style,
  .editpdf-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .editpdf-tool-strip::-webkit-scrollbar,
  .editpdf-quick-style::-webkit-scrollbar,
  .editpdf-toolbar-actions::-webkit-scrollbar {
    display: none;
  }

  .editpdf-tool-button,
  .editpdf-toolbar-actions button {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #4a505c;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .editpdf-tool-button {
    padding: 0 11px;
  }

  .editpdf-toolbar-actions button {
    width: 38px;
  }

  .editpdf-tool-button:hover,
  .editpdf-tool-button.active,
  .editpdf-toolbar-actions button:hover:not(:disabled) {
    background: #f1f3f7;
    color: #ef312c;
  }

  html[data-theme='dark'] .editpdf-tool-button,
  html[data-theme='dark'] .editpdf-toolbar-actions button {
    color: #aeb8c8;
  }

  html[data-theme='dark'] .editpdf-tool-button:hover,
  html[data-theme='dark'] .editpdf-tool-button.active,
  html[data-theme='dark'] .editpdf-toolbar-actions button:hover:not(:disabled) {
    background: #1a2533;
    color: #f29c4b;
  }

  html[data-theme='dark'] .editpdf-quick-style {
    border-color: rgba(255, 193, 117, 0.14);
  }

  html[data-theme='dark'] .editpdf-quick-label,
  html[data-theme='dark'] .editpdf-quick-width span {
    color: #aeb8c8;
  }

  html[data-theme='dark'] .editpdf-quick-width input {
    background: #131b28;
    border-color: rgba(255, 193, 117, 0.18);
    color: #e0e6ef;
  }

  .editpdf-toolbar-actions button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .editpdf-quick-style {
    flex: 0 0 auto;
    border-left: 1px solid #d5dae4;
    border-right: 1px solid #d5dae4;
    padding: 0 12px;
  }

  .editpdf-quick-label,
  .editpdf-quick-width span {
    color: #6b7280;
    font-size: 0.74rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editpdf-quick-swatch {
    width: 25px;
    height: 25px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 0 1px #aeb8c8;
    flex: 0 0 auto;
  }

  .editpdf-quick-swatch.active {
    box-shadow: 0 0 0 3px #1387ff;
  }

  .editpdf-quick-width {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 4px;
  }

  .editpdf-quick-width input {
    width: 48px;
    height: 32px;
    border: 1px solid #cbd3de;
    border-radius: 6px;
    background: #ffffff;
    color: #232936;
    padding: 0 6px;
    font-weight: 900;
  }

  .editpdf-toolbar-rule {
    width: 1px;
    height: 24px;
    background: #d5dae4;
    margin: 0 4px;
    flex: 0 0 auto;
  }

  .editpdf-zoom-value {
    min-width: 52px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #eef1f6;
    font-size: 0.85rem;
    font-weight: 900;
    color: #232936;
  }

  html[data-theme='dark'] .editpdf-zoom-value {
    background: #1a2533;
    color: #e0e6ef;
  }

  .editpdf-editor-body {
    min-height: 0;
    flex: 1;
    display: grid;
    grid-template-columns: 250px minmax(0, 1fr) 360px;
  }

  .editpdf-left-panel,
  .editpdf-right-panel {
    min-height: 0;
    background: #ffffff;
  }

  html[data-theme='dark'] .editpdf-left-panel,
  html[data-theme='dark'] .editpdf-right-panel {
    background: #101823;
  }

  .editpdf-left-panel {
    border-right: 1px solid #cbd1dc;
    display: flex;
    flex-direction: column;
  }

  .editpdf-panel-title {
    padding: 18px 20px 10px;
    color: #232936;
    font-size: 0.88rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  html[data-theme='dark'] .editpdf-panel-title {
    color: #e0e6ef;
  }

  .editpdf-thumbnails {
    min-height: 0;
    overflow: auto;
    display: grid;
    gap: 22px;
    justify-items: center;
    padding: 10px 20px 28px;
  }

  .editpdf-thumbnail {
    width: 148px;
    display: grid;
    gap: 10px;
    justify-items: center;
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: #3b4250;
  }

  .editpdf-thumb-frame {
    width: 120px;
    aspect-ratio: 0.707;
    display: block;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #d6dbe4;
    box-shadow: 0 5px 12px rgba(15, 23, 42, 0.18);
  }

  .editpdf-thumbnail.active .editpdf-thumb-frame {
    border-color: #1387ff;
    box-shadow: 0 0 0 1px #1387ff, 0 6px 16px rgba(19, 135, 255, 0.22);
  }

  .editpdf-thumb-frame img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .editpdf-page-num {
    font-size: 0.94rem;
    font-weight: 800;
  }

  .editpdf-canvas-area {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: #eceff4;
    border-right: 1px solid #d5dae4;
  }

  html[data-theme='dark'] .editpdf-canvas-area {
    background: #0a0f1a;
    border-right-color: rgba(255, 193, 117, 0.14);
  }

  .editpdf-hidden-input {
    display: none;
  }

  .editpdf-canvas-scroller {
    height: 100%;
    overflow: auto;
    padding: 30px max(22px, 4vw) 110px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 34px;
    scroll-behavior: smooth;
  }

  .editpdf-page-block {
    position: relative;
    flex: 0 0 auto;
    background: #ffffff;
    box-shadow: 0 8px 26px rgba(15, 23, 42, 0.22);
    line-height: 0;
  }

  .editpdf-page-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    user-select: none;
    pointer-events: none;
  }

  .editpdf-page-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  .editpdf-page-badge {
    position: absolute;
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(60, 65, 80, 0.76);
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 99px;
    white-space: nowrap;
    pointer-events: none;
  }

  .editpdf-ann {
    position: absolute;
    box-sizing: border-box;
    cursor: move;
    user-select: none;
  }

  .editpdf-ann.selected {
    outline: 2px solid #1387ff;
    outline-offset: 1px;
  }

  .editpdf-ann-text {
    min-width: 44px;
    min-height: 24px;
    display: flex;
    align-items: flex-start;
    padding: 4px 6px;
    background: transparent;
    border: 1px dashed rgba(19, 135, 255, 0.5);
    line-height: 1.2;
  }

  .editpdf-ann-text-content {
    width: 100%;
    min-height: 100%;
    height: 100%;
    outline: none;
    white-space: pre-wrap;
    overflow: hidden;
    cursor: text;
    word-break: break-word;
    resize: none;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 1.2;
    direction: ltr;
    unicode-bidi: plaintext;
  }

  .editpdf-ann-image {
    border: 1px solid rgba(19, 135, 255, 0.45);
    background: rgba(255, 255, 255, 0.35);
  }

  .editpdf-ann-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    pointer-events: none;
  }

  .editpdf-ann-shape {
    cursor: move;
  }

  .editpdf-ann-delete {
    position: absolute;
    top: -14px;
    right: -14px;
    width: 24px;
    height: 24px;
    display: inline-grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: #ef312c;
    color: #ffffff;
    cursor: pointer;
    z-index: 4;
    box-shadow: 0 2px 8px rgba(239, 49, 44, 0.3);
  }

  .editpdf-ann-resize {
    position: absolute;
    right: -6px;
    bottom: -6px;
    width: 12px;
    height: 12px;
    border: 2px solid #1387ff;
    background: #ffffff;
    border-radius: 2px;
    cursor: nwse-resize;
    z-index: 3;
  }

  .editpdf-vector-ann,
  .editpdf-draft-vector {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  }

  .editpdf-vector-ann line,
  .editpdf-vector-ann polyline {
    pointer-events: stroke;
  }

  .editpdf-vector-ann.selected {
    filter: drop-shadow(0 0 3px rgba(19, 135, 255, 0.85));
  }

  .editpdf-draft-shape {
    position: absolute;
    border: 2px dashed #1387ff;
    pointer-events: none;
  }

  .editpdf-bottom-controls {
    position: absolute;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    min-height: 46px;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 10px;
    border-radius: 6px;
    background: #53545d;
    color: #ffffff;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.2);
  }

  .editpdf-bottom-controls button {
    width: 34px;
    height: 32px;
    display: inline-grid;
    place-items: center;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
  }

  .editpdf-bottom-controls button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.13);
  }

  .editpdf-bottom-controls button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .editpdf-page-control,
  .editpdf-total-control {
    min-width: 42px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    background: #73737e;
    font-weight: 900;
  }

  .editpdf-total-control {
    min-width: 50px;
  }

  .editpdf-right-panel {
    display: flex;
    flex-direction: column;
    border-left: 1px solid #d5dae4;
  }

  .editpdf-style-panel {
    min-height: 0;
    overflow: auto;
    padding: 22px 26px;
  }

  .editpdf-style-panel h2 {
    margin: 0 0 14px;
    color: #232936;
    font-size: 1.72rem;
    line-height: 1.1;
  }

  .editpdf-info-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin: 0;
    padding: 13px 14px;
    border-radius: 7px;
    background: #dff1ff;
    color: #0b1b30;
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .editpdf-info-note svg {
    flex: 0 0 auto;
    color: #1187ee;
    margin-top: 2px;
  }

  .editpdf-panel-rule {
    height: 1px;
    background: #d7dbe4;
    margin: 22px 0 18px;
  }

  .editpdf-selection-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .editpdf-selection-header h3,
  .editpdf-properties h3 {
    margin: 0;
    color: #232936;
    font-size: 0.96rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editpdf-selection-header span {
    color: #6b7280;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .editpdf-items-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .editpdf-item-row {
    width: 100%;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #d8dde6;
    border-radius: 6px;
    background: #f8f9fb;
    color: #232936;
    cursor: pointer;
    padding: 0 10px;
    font-size: 0.9rem;
    font-weight: 800;
    text-align: left;
  }

  .editpdf-item-row.selected {
    background: #e8f2ff;
    border-color: #1387ff;
  }

  .editpdf-item-row svg {
    color: #9ca3af;
    flex: 0 0 auto;
  }

  .editpdf-item-row svg:hover {
    color: #ef312c;
  }

  .editpdf-empty-layer,
  .editpdf-properties-empty {
    border: 1px dashed #cfd5df;
    border-radius: 7px;
    padding: 16px;
    color: #6b7280;
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .editpdf-properties {
    display: grid;
    gap: 14px;
  }

  .editpdf-properties label {
    display: grid;
    gap: 7px;
    color: #374151;
    font-size: 0.82rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .editpdf-properties textarea,
  .editpdf-properties input[type='number'] {
    width: 100%;
    border: 1px solid #cbd3de;
    border-radius: 6px;
    background: #ffffff;
    color: #111827;
    padding: 9px 10px;
    font: inherit;
    text-transform: none;
  }

  .editpdf-properties textarea {
    min-height: 82px;
    resize: vertical;
  }

  .editpdf-properties input[type='color'] {
    width: 100%;
    height: 38px;
    border: 1px solid #cbd3de;
    border-radius: 6px;
    padding: 3px;
    background: #ffffff;
  }

  .editpdf-properties input[type='range'] {
    width: 100%;
    accent-color: #ef312c;
  }

  .editpdf-two-cols {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .editpdf-toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .editpdf-toggle-row button {
    width: 38px;
    height: 34px;
    border: 1px solid #cbd3de;
    border-radius: 6px;
    background: #ffffff;
    color: #232936;
    cursor: pointer;
    font-weight: 900;
  }

  .editpdf-toggle-row button:nth-child(2) {
    font-style: italic;
  }

  .editpdf-toggle-row button.active {
    border-color: #ef312c;
    background: #fff1f1;
    color: #ef312c;
  }

  .editpdf-color-palette {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .editpdf-color-palette button {
    width: 28px;
    height: 28px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 0 1px #cbd3de;
  }

  .editpdf-delete-selected {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 0;
    border-radius: 7px;
    background: #fff1f1;
    color: #ef312c;
    cursor: pointer;
    font-weight: 900;
  }

  .editpdf-save-zone {
    margin-top: auto;
    padding: 18px 22px 22px;
    background: #ffffff;
    border-top: 1px solid #e1e5ec;
  }

  .editpdf-clean-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .editpdf-clean-actions button {
    min-height: 36px;
    border: 1px solid #d5dae4;
    border-radius: 6px;
    background: #ffffff;
    color: #4b5563;
    cursor: pointer;
    font-weight: 900;
  }

  .editpdf-clean-actions button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .editpdf-save-btn {
    width: 100%;
    min-height: 72px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border: 0;
    border-radius: 8px;
    background: #ef312c;
    color: #ffffff;
    font-size: 1.45rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(239, 49, 44, 0.24);
  }

  .editpdf-save-btn:hover:not(:disabled) {
    background: #e52520;
  }

  .editpdf-save-btn:disabled {
    cursor: progress;
    opacity: 0.72;
  }

  html[data-theme='dark'] .editpdf-left-panel,
  html[data-theme='dark'] .editpdf-right-panel,
  html[data-theme='dark'] .editpdf-save-zone {
    border-color: rgba(255, 193, 117, 0.14);
  }

  html[data-theme='dark'] .editpdf-style-panel h2,
  html[data-theme='dark'] .editpdf-selection-header h3,
  html[data-theme='dark'] .editpdf-properties h3 {
    color: #f5f7fb;
  }

  html[data-theme='dark'] .editpdf-info-note {
    background: rgba(79, 168, 255, 0.16);
    color: #a8d4ff;
  }

  html[data-theme='dark'] .editpdf-panel-rule {
    background: rgba(255, 193, 117, 0.14);
  }

  html[data-theme='dark'] .editpdf-item-row,
  html[data-theme='dark'] .editpdf-properties textarea,
  html[data-theme='dark'] .editpdf-properties input[type='number'],
  html[data-theme='dark'] .editpdf-properties input[type='color'],
  html[data-theme='dark'] .editpdf-toggle-row button,
  html[data-theme='dark'] .editpdf-clean-actions button {
    background: #131b28;
    border-color: rgba(255, 193, 117, 0.18);
    color: #e0e6ef;
  }

  html[data-theme='dark'] .editpdf-empty-layer,
  html[data-theme='dark'] .editpdf-properties-empty {
    border-color: rgba(255, 193, 117, 0.18);
    color: #aeb8c8;
  }

  html[data-theme='dark'] .editpdf-item-row.selected {
    background: rgba(19, 135, 255, 0.16);
    border-color: rgba(19, 135, 255, 0.55);
  }

  @media (max-width: 1180px) {
    .editpdf-editor-body {
      grid-template-columns: 210px minmax(0, 1fr) 320px;
    }

    .editpdf-tool-button span {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .editpdf-editor-open {
      height: auto;
      min-height: 100vh;
      overflow: auto;
    }

    .editpdf-app-header {
      height: auto;
      min-height: 68px;
      flex-wrap: wrap;
      padding: 12px 16px;
      gap: 12px;
    }

    .editpdf-brand {
      min-width: auto;
    }

    .editpdf-header-nav {
      order: 3;
      width: 100%;
    }

    .editpdf-workbench {
      height: auto;
      min-height: calc(100vh - 68px);
    }

    .editpdf-toolbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .editpdf-editor-body {
      display: flex;
      flex-direction: column;
    }

    .editpdf-left-panel {
      max-height: 190px;
      border-right: 0;
      border-bottom: 1px solid #cbd1dc;
    }

    .editpdf-panel-title {
      padding-bottom: 6px;
    }

    .editpdf-thumbnails {
      display: flex;
      overflow-x: auto;
      overflow-y: hidden;
      justify-content: flex-start;
      padding: 8px 16px 16px;
    }

    .editpdf-canvas-area {
      min-height: 72vh;
      border-right: 0;
    }

    .editpdf-right-panel {
      border-left: 0;
      border-top: 1px solid #d5dae4;
    }
  }

  @media (max-width: 640px) {
    .editpdf-header-nav a {
      font-size: 0.82rem;
    }

    .editpdf-upload-btn {
      width: 100%;
      padding-inline: 18px;
      font-size: 1.15rem;
    }

    .editpdf-uploader {
      min-height: 240px;
      padding: 26px 18px;
    }

    .editpdf-canvas-scroller {
      padding-inline: 16px;
    }

    .editpdf-bottom-controls {
      width: calc(100% - 26px);
      justify-content: center;
    }

    .editpdf-two-cols,
    .editpdf-clean-actions {
      grid-template-columns: 1fr;
    }
  }
`;
