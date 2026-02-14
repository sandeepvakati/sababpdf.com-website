# Deployment Guide - Render.com

## Prerequisites
- GitHub account
- Render.com account (free)

## Step-by-Step Deployment

### Step 1: Push Backend to GitHub

```bash
# Navigate to backend folder
cd backend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add PowerPoint to PDF backend"

# Create a new GitHub repository called "pptx-pdf-backend"
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/pptx-pdf-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** and authorize Render
4. Select your **"pptx-pdf-backend"** repository
5. Configure the service:
   - **Name:** `pptx-to-pdf-api` (or any name you like)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** Leave empty (or `.` if needed)
   - **Environment:** **Docker**
   - **Plan:** **Free**
6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. Once deployed, you'll see: ✅ **Live** with a URL like:
   ```
   https://pptx-to-pdf-api.onrender.com
   ```

### Step 3: Test Your API

Open your browser and visit:
```
https://pptx-to-pdf-api.onrender.com
```

You should see:
```json
{
  "status": "ok",
  "message": "PowerPoint to PDF API is running",
  "version": "1.0.0"
}
```

### Step 4: Copy Your API URL

Copy the full URL (e.g., `https://pptx-to-pdf-api.onrender.com`)

You'll need this for the frontend in the next step!

---

## Troubleshooting

### Build Failed
- Check the build logs in Render dashboard
- Make sure all files are committed to GitHub
- Verify Dockerfile syntax

### Service Not Starting
- Check the logs in Render dashboard
- Verify PORT environment variable is set correctly
- Make sure LibreOffice installed properly

### Cold Starts (First Request Slow)
- This is normal on free tier
- Server spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Solution: Add loading message in frontend

---

## Optional: Keep Server Awake

To avoid cold starts, use a free uptime monitor:

1. Go to https://uptimerobot.com (free)
2. Add new monitor
3. URL: `https://your-api-url.onrender.com/health`
4. Interval: 14 minutes
5. This pings your server every 14 minutes to keep it awake

---

## Next Steps

After deployment, update your frontend with the API URL!
