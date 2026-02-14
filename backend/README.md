# PowerPoint to PDF Backend API

Professional PowerPoint to PDF conversion using LibreOffice.

## Features

- ✅ Professional quality conversion (same as iLovePDF)
- ✅ Supports .pptx files
- ✅ Preserves formatting, images, and layouts
- ✅ Free and unlimited
- ✅ Docker-based deployment

## API Endpoints

### Health Check
```
GET /
GET /health
```

### Convert PPTX to PDF
```
POST /convert/pptx-to-pdf
Content-Type: multipart/form-data
Body: file (PPTX file)
```

## Local Development

```bash
# Install dependencies
npm install

# Run server
npm start
```

## Docker Deployment

```bash
# Build image
docker build -t pptx-converter .

# Run container
docker run -p 3001:3001 pptx-converter
```

## Deploy to Render

1. Push this folder to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect GitHub repo
5. Select "Docker" environment
6. Deploy!

## Environment Variables

- `PORT` - Server port (default: 3001)

## License

MIT
