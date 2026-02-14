const express = require('express');
const multer = require('multer');
const libre = require('libreoffice-convert');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
    origin: '*', // Allow all origins (you can restrict this to your Netlify domain later)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Configure file upload (max 50MB for large presentations)
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PowerPoint to PDF API is running',
        version: '1.0.0',
        endpoints: {
            health: 'GET /',
            convert: 'POST /convert/pptx-to-pdf'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Conversion endpoint
app.post('/convert/pptx-to-pdf', upload.single('file'), async (req, res) => {
    const startTime = Date.now();

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`[${new Date().toISOString()}] Converting file: ${req.file.originalname}`);

        const inputPath = req.file.path;
        const outputPath = `${inputPath}.pdf`;

        // Read the uploaded file
        const pptxBuf = fs.readFileSync(inputPath);

        // Convert to PDF using LibreOffice
        libre.convert(pptxBuf, '.pdf', undefined, (err, pdfBuf) => {
            if (err) {
                console.error('Conversion error:', err);
                // Cleanup
                try {
                    fs.unlinkSync(inputPath);
                } catch (cleanupErr) {
                    console.error('Cleanup error:', cleanupErr);
                }
                return res.status(500).json({
                    error: 'Conversion failed',
                    details: err.message
                });
            }

            // Write PDF to file
            fs.writeFileSync(outputPath, pdfBuf);

            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] Conversion completed in ${duration}ms`);

            // Send PDF back to client
            res.download(outputPath, req.file.originalname.replace(/\.pptx$/i, '.pdf'), (downloadErr) => {
                // Cleanup temp files
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (cleanupErr) {
                    console.error('Cleanup error:', cleanupErr);
                }

                if (downloadErr) {
                    console.error('Download error:', downloadErr);
                }
            });
        });
    } catch (error) {
        console.error('Server error:', error);

        // Cleanup on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupErr) {
                console.error('Cleanup error:', cleanupErr);
            }
        }

        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 PowerPoint to PDF API running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`🔄 Convert endpoint: POST http://localhost:${PORT}/convert/pptx-to-pdf`);
});
