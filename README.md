# SababPDF – Complete PDF Tools Website

A complete, production-ready PDF tools website built with Next.js 14.

## 🛠️ Tools Included

### Client-Side (works instantly in browser, no backend needed)
- ✅ Merge PDF
- ✅ Split PDF
- ✅ Compress PDF
- ✅ Rotate PDF
- ✅ Delete Pages
- ✅ Reorder Pages
- ✅ JPG to PDF
- ✅ PDF to JPG
- ✅ Watermark PDF
- ✅ Add Page Numbers
- ✅ Protect PDF (password)
- ✅ Unlock PDF

### Server-Side (requires backend + LibreOffice)
- 📡 Word to PDF
- 📡 Excel to PDF
- 📡 PowerPoint to PDF
- 📡 HTML to PDF
- 📡 PDF to Word
- 📡 PDF to Excel

---

## 🚀 Quick Setup

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🖥️ Backend Setup (for Office/HTML conversions)

### Install on AWS EC2 (Ubuntu)
```bash
# 1. Install LibreOffice
sudo apt-get update
sudo apt-get install -y libreoffice

# 2. Install Python tools
pip3 install pdf2docx tabula-py

# 3. Install backend dependencies
cd backend
npm install

# 4. Start backend
npm start
# or with PM2:
pm2 start server.js --name sababpdf-api
```

### Backend ENV
```bash
PORT=5000
FRONTEND_URL=https://sababpdf.com
```

---

## 💰 Google AdSense Setup

1. Apply at https://www.google.com/adsense
2. Once approved, get your Publisher ID (ca-pub-XXXXXXXXXX)
3. Open `components/AdBanner.js`
4. Replace `ca-pub-XXXXXXXXXX` with your real publisher ID
5. Replace the AD_SLOTS values with your real ad unit IDs
6. Uncomment the AdSense script in `app/layout.js`

---

## 🌐 AWS EC2 Deployment

### Frontend (Next.js)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build and run with PM2
npm run build
pm2 start npm --name sababpdf-frontend -- start
pm2 save
pm2 startup
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name sababpdf.com www.sababpdf.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 50M;
    }
}
```

### SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sababpdf.com -d www.sababpdf.com
```

---

## 📁 Project Structure

```
/app                    # Next.js pages (App Router)
  /page.js              # Homepage with all tools
  /merge-pdf/page.js    # Each tool has its own page
  /[tool]/page.js       # ...
/components
  Navbar.js             # Top navigation with search
  Footer.js             # Footer with links
  ToolLayout.js         # Wrapper for all tool pages
  FileUploader.js       # Drag & drop file upload
  AdBanner.js           # Google AdSense banners
/lib
  toolsList.js          # All tool configurations
  pdfUtils.js           # Client-side PDF processing
/backend
  server.js             # Express API server
  package.json          # Backend dependencies
```

---

## 🔑 Key Features

- **No file size limit** for client-side tools
- **Files never leave your browser** for client-side tools
- **Google AdSense ready** — just add your publisher ID
- **Mobile responsive** design
- **SEO optimized** with proper metadata
- **Fast loading** — lazy imports for PDF libraries
