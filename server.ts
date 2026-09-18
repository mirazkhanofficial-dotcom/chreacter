import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '9cf974acba9d5d5d715bf14db07d697a';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON & URL-encoded payloads up to 50MB for image transfers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      imgbbConfigured: !!IMGBB_API_KEY 
    });
  });

  // ImgBB Upload Endpoint
  app.post('/api/upload-imgbb', async (req, res) => {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: 'Image data is required' });
      }

      // Strip data URL prefix if present so ImgBB receives clean base64
      let base64Clean = image;
      if (typeof image === 'string' && image.includes(',')) {
        base64Clean = image.split(',')[1];
      }

      const apiKey = process.env.IMGBB_API_KEY || '9cf974acba9d5d5d715bf14db07d697a';

      // Build FormData for ImgBB API
      const formData = new FormData();
      formData.append('image', base64Clean);
      if (name) {
        formData.append('name', name);
      }

      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      const data = await imgbbRes.json();

      if (!imgbbRes.ok || !data.success) {
        console.error('ImgBB API response error:', data);
        return res.status(imgbbRes.status || 500).json({
          success: false,
          error: data?.error?.message || 'ImgBB upload rejected',
          details: data,
        });
      }

      return res.json({
        success: true,
        url: data.data.url,
        display_url: data.data.display_url,
        thumb_url: data.data.thumb?.url,
        delete_url: data.data.delete_url,
        title: data.data.title,
        id: data.data.id,
      });
    } catch (error: any) {
      console.error('Server error during ImgBB upload:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Server error uploading to ImgBB',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
