// ============================================================
// SababPDF Backend Server
// Uses LibreOffice for Office → PDF conversions
//
// SETUP:
// 1. sudo apt-get install libreoffice
// 2. npm install express multer cors helmet morgan uuid
// 3. node server.js
// ============================================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const logger = console;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
const LIBREOFFICE_BIN =
  process.env.LIBREOFFICE_BIN || (process.platform === 'win32' ? 'soffice' : 'libreoffice');
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

// Progress tracking system
const progressMap = new Map();

function createProgressTracker(id) {
  const tracker = {
    id,
    progress: 0,
    status: 'Starting',
    startTime: Date.now(),
    estimatedTime: 0
  };
  progressMap.set(id, tracker);
  return tracker;
}

function updateProgress(id, progress, status) {
  if (progressMap.has(id)) {
    const tracker = progressMap.get(id);
    tracker.progress = Math.min(100, progress);
    tracker.status = status;
    tracker.elapsedTime = Date.now() - tracker.startTime;
    
    // Estimate remaining time
    if (progress > 0 && progress < 100) {
      const timePerPercent = tracker.elapsedTime / progress;
      tracker.estimatedTime = timePerPercent * (100 - progress);
    }
  }
}

function getProgress(id) {
  return progressMap.get(id) || { progress: 0, status: 'Not found' };
}

function clearProgress(id) {
  setTimeout(() => progressMap.delete(id), 5000); // Keep for 5 seconds after completion
}

// Ensure dirs exist
[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(helmet());
app.use(express.json());

// Multer storage
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'text/html',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(doc|docx|xls|xlsx|ppt|pptx|pdf|html)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  },
});

// ===== CLEANUP helper =====
function cleanup(...files) {
  files.forEach(f => { try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch {} });
}

// ===== LibreOffice conversion =====
function libreofficeConvert(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const cmd = `"${LIBREOFFICE_BIN}" --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
    exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`LibreOffice error: ${stderr || err.message}`));
      resolve(stdout);
    });
  });
}

// ===== ROUTES =====

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'SababPDF API' }));

// Progress tracking endpoint
app.get('/api/progress/:id', (req, res) => {
  const progress = getProgress(req.params.id);
  res.json(progress);
});

// Word to PDF
app.post('/api/convert/word-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const conversionId = uuidv4();
  const tracker = createProgressTracker(conversionId);
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    updateProgress(conversionId, 10, 'Preparing conversion');
    
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    updateProgress(conversionId, 80, 'Finalizing');
    
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Conversion failed - output not found');
    }

    updateProgress(conversionId, 100, 'Complete');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf"`);
    res.setHeader('X-Conversion-ID', conversionId);
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      cleanup(inputPath, outputPath);
      clearProgress(conversionId);
    });
    stream.on('error', () => {
      cleanup(inputPath, outputPath);
      res.status(500).json({ error: 'Stream error' });
      clearProgress(conversionId);
    });
  } catch (e) {
    cleanup(inputPath);
    console.error(e);
    updateProgress(conversionId, 0, `Error: ${e.message}`);
    res.status(500).json({ error: e.message, conversionId });
    clearProgress(conversionId);
  }
});

// Excel to PDF
app.post('/api/convert/excel-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const conversionId = uuidv4();
  const tracker = createProgressTracker(conversionId);
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    updateProgress(conversionId, 10, 'Preparing conversion');
    
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    updateProgress(conversionId, 80, 'Finalizing');
    
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
    updateProgress(conversionId, 100, 'Complete');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="spreadsheet.pdf"');
    res.setHeader('X-Conversion-ID', conversionId);
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      cleanup(inputPath, outputPath);
      clearProgress(conversionId);
    });
    stream.on('error', () => {
      cleanup(inputPath, outputPath);
      clearProgress(conversionId);
    });
  } catch (e) {
    cleanup(inputPath);
    updateProgress(conversionId, 0, `Error: ${e.message}`);
    res.status(500).json({ error: e.message, conversionId });
    clearProgress(conversionId);
  }
});

// PowerPoint to PDF
app.post('/api/convert/ppt-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const conversionId = uuidv4();
  const tracker = createProgressTracker(conversionId);
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    updateProgress(conversionId, 10, 'Preparing conversion');
    
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    updateProgress(conversionId, 80, 'Finalizing');
    
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
    updateProgress(conversionId, 100, 'Complete');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="presentation.pdf"');
    res.setHeader('X-Conversion-ID', conversionId);
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      cleanup(inputPath, outputPath);
      clearProgress(conversionId);
    });
    stream.on('error', () => {
      cleanup(inputPath, outputPath);
      clearProgress(conversionId);
    });
  } catch (e) {
    cleanup(inputPath);
    updateProgress(conversionId, 0, `Error: ${e.message}`);
    res.status(500).json({ error: e.message, conversionId });
    clearProgress(conversionId);
  }
});

// HTML to PDF (via LibreOffice)
app.post('/api/convert/html-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const conversionId = uuidv4();
  const tracker = createProgressTracker(conversionId);
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    updateProgress(conversionId, 10, 'Preparing conversion');
    
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    updateProgress(conversionId, 80, 'Finalizing');
    
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
    updateProgress(conversionId, 100, 'Complete');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="webpage.pdf"');
    res.setHeader('X-Conversion-ID', conversionId);
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      cleanup(inputPath, outputPath);
      clearProgress(conversionId);
    });
  } catch (e) {
    cleanup(inputPath);
    updateProgress(conversionId, 0, `Error: ${e.message}`);
    res.status(500).json({ error: e.message, conversionId });
    clearProgress(conversionId);
  }
});

// PDF to Word (using FAST optimized Python converter - iLovePDF style)
// KEY FIX: Uses pdfplumber document opened ONCE instead of reopening for every page
app.post('/api/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      conversionId: null
    });
  }

  const conversionId = uuidv4();
  const tracker = createProgressTracker(conversionId);
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUT_DIR, `${uuidv4()}.docx`);
  // Use the FAST converter (optimized table detection - opens pdfplumber once)
  const converterScript = path.join(__dirname, 'pdf_to_word_fast.py');
  const rawMode = (req.body?.mode || '').toString().trim().toLowerCase();
  const conversionMode = rawMode === 'layout' ? 'layout' : rawMode === 'ocr' ? 'ocr' : 'no-ocr';
  
  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    updateProgress(conversionId, 0, 'Input file not found');
    clearProgress(conversionId);
    return res.status(400).json({ 
      error: 'Input file not found',
      conversionId 
    });
  }
  
  // Validate converter script exists
  if (!fs.existsSync(converterScript)) {
    cleanup(inputPath);
    updateProgress(conversionId, 0, 'Converter script not found');
    clearProgress(conversionId);
    return res.status(500).json({ 
      error: 'PDF converter not properly installed',
      conversionId 
    });
  }
  
  updateProgress(conversionId, 5, 'Starting Python converter...');

  exec(
    `"${PYTHON_BIN}" "${converterScript}" "${inputPath}" "${outputPath}" "${conversionMode}"`,
    { timeout: 10 * 60 * 1000, maxBuffer: 25 * 1024 * 1024 }, // 10 min timeout
    (err, stdout, stderr) => {
      try {
        updateProgress(conversionId, 70, 'Processing PDF...');
        
        // Try to parse JSON response from Python script
        let result = { success: false, message: 'Unknown error' };
        
        if (stdout) {
          try {
            result = JSON.parse(stdout);
          } catch (parseErr) {
            logger.warn(`Could not parse Python output as JSON: ${stdout}`);
            result = { 
              success: false, 
              message: stdout || 'Conversion process completed but output is unreadable' 
            };
          }
        }
        
        if (stderr) {
          logger.error(`Python stderr: ${stderr}`);
        }

        // Check for conversion success
        const outputExists = fs.existsSync(outputPath);
        const outputSize = outputExists ? fs.statSync(outputPath).size : 0;
        
        if (err) {
          logger.error(`Python execution error: ${err.message}`);
          cleanup(inputPath, outputPath);
          const errorMsg = err.message || 'Python execution failed';
          updateProgress(conversionId, 0, `Error: ${errorMsg}`);
          clearProgress(conversionId);
          return res.status(500).json({ 
            error: errorMsg, 
            conversionId,
            details: stderr 
          });
        }

        if (!result.success || !outputExists || outputSize === 0) {
          cleanup(inputPath, outputPath);
          const errorMsg = result.message || stderr || 'PDF to Word conversion failed. Ensure python-docx, pymupdf, and pdfplumber are installed.';
          updateProgress(conversionId, 0, `Error: ${errorMsg}`);
          clearProgress(conversionId);
          return res.status(500).json({ 
            error: errorMsg, 
            conversionId,
            pythonOutput: result 
          });
        }

        updateProgress(conversionId, 95, 'Finalizing document...');

        // Stream the converted file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.docx"');
        res.setHeader('X-Conversion-ID', conversionId);
        res.setHeader('Content-Length', outputSize);
        
        const stream = fs.createReadStream(outputPath);
        
        stream.on('error', (streamErr) => {
          logger.error(`Stream error: ${streamErr.message}`);
          cleanup(inputPath, outputPath);
          updateProgress(conversionId, 0, 'File streaming error');
          clearProgress(conversionId);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'File streaming error: ' + streamErr.message,
              conversionId 
            });
          }
        });
        
        stream.pipe(res);
        
        stream.on('end', () => {
          updateProgress(conversionId, 100, 'Complete');
          cleanup(inputPath, outputPath);
          clearProgress(conversionId);
          logger.info(`Conversion completed successfully: ${outputPath} (${outputSize} bytes)`);
        });
        
      } catch (e) {
        logger.error(`Unexpected error in conversion handler: ${e.message}`);
        cleanup(inputPath, outputPath);
        updateProgress(conversionId, 0, `Error: ${e.message}`);
        clearProgress(conversionId);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: e.message, 
            conversionId,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined 
          });
        }
      }
    }
  );
});

// PDF to Excel (using tabula-py if available)
app.post('/api/convert/pdf-to-excel', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const conversionId = uuidv4();
  const tracker = createProgressTracker(conversionId);
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUT_DIR, `${uuidv4()}.xlsx`);

  updateProgress(conversionId, 5, 'Extracting tables');

  const cmd = `"${PYTHON_BIN}" -c "import tabula; tabula.convert_into('${inputPath}', '${outputPath}', output_format='xlsx', pages='all')"`;

  exec(cmd, { timeout: 60000 }, (err) => {
    if (err || !fs.existsSync(outputPath)) {
      cleanup(inputPath, outputPath);
      updateProgress(conversionId, 0, 'PDF to Excel conversion failed');
      clearProgress(conversionId);
      return res.status(500).json({ error: 'PDF to Excel requires tabula-py. Install: pip install tabula-py', conversionId });
    }
    
    updateProgress(conversionId, 95, 'Finalizing spreadsheet');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.xlsx"');
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      updateProgress(conversionId, 100, 'Complete');
      cleanup(inputPath, outputPath);
      clearProgress(conversionId);
    });
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 SababPDF API running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`\n📋 Required system packages:`);
  console.log(`   LibreOffice command: ${LIBREOFFICE_BIN}`);
  console.log(`   Python command: ${PYTHON_BIN}`);
  console.log(`   Install pdf2docx and tabula-py for PDF conversion extras`);
});

module.exports = app;
