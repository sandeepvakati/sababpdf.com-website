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
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');

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
    const cmd = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
    exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`LibreOffice error: ${stderr || err.message}`));
      resolve(stdout);
    });
  });
}

// ===== ROUTES =====

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'SababPDF API' }));

// Word to PDF
app.post('/api/convert/word-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Conversion failed - output not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf"`);
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => cleanup(inputPath, outputPath));
    stream.on('error', () => { cleanup(inputPath, outputPath); res.status(500).json({ error: 'Stream error' }); });
  } catch (e) {
    cleanup(inputPath);
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Excel to PDF
app.post('/api/convert/excel-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="spreadsheet.pdf"');
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => cleanup(inputPath, outputPath));
    stream.on('error', () => cleanup(inputPath, outputPath));
  } catch (e) {
    cleanup(inputPath);
    res.status(500).json({ error: e.message });
  }
});

// PowerPoint to PDF
app.post('/api/convert/ppt-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="presentation.pdf"');
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => cleanup(inputPath, outputPath));
    stream.on('error', () => cleanup(inputPath, outputPath));
  } catch (e) {
    cleanup(inputPath);
    res.status(500).json({ error: e.message });
  }
});

// HTML to PDF (via LibreOffice)
app.post('/api/convert/html-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  try {
    await libreofficeConvert(inputPath, OUTPUT_DIR);
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="webpage.pdf"');
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => cleanup(inputPath, outputPath));
  } catch (e) {
    cleanup(inputPath);
    res.status(500).json({ error: e.message });
  }
});

// PDF to Word (using Python's pdf2docx if available)
app.post('/api/convert/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUT_DIR, `${uuidv4()}.docx`);

  const cmd = `python3 -c "from pdf2docx import Converter; cv = Converter('${inputPath}'); cv.convert('${outputPath}'); cv.close()"`;

  exec(cmd, { timeout: 60000 }, (err) => {
    if (err || !fs.existsSync(outputPath)) {
      cleanup(inputPath, outputPath);
      return res.status(500).json({ error: 'PDF to Word conversion requires pdf2docx. Install: pip install pdf2docx' });
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.docx"');
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => cleanup(inputPath, outputPath));
  });
});

// PDF to Excel (using tabula-py if available)
app.post('/api/convert/pdf-to-excel', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const outputPath = path.join(OUTPUT_DIR, `${uuidv4()}.xlsx`);

  const cmd = `python3 -c "import tabula; tabula.convert_into('${inputPath}', '${outputPath}', output_format='xlsx', pages='all')"`;

  exec(cmd, { timeout: 60000 }, (err) => {
    if (err || !fs.existsSync(outputPath)) {
      cleanup(inputPath, outputPath);
      return res.status(500).json({ error: 'PDF to Excel requires tabula-py. Install: pip install tabula-py' });
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.xlsx"');
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => cleanup(inputPath, outputPath));
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
  console.log(`   sudo apt-get install libreoffice`);
  console.log(`   pip install pdf2docx tabula-py`);
});

module.exports = app;
