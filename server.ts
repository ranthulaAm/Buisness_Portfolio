import express from "express";
import path from "path";
import https from "https";
import http from "http";
import { Readable, PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy endpoint to bypass CORS for file downloads
  
  // Convert and download endpoint for audio files
  app.get("/api/convert-download", async (req, res) => {
    const fileUrl = req.query.url as string;
    
    if (!fileUrl) {
      return res.status(400).send("URL parameter is required");
    }

    try {
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch: ${response.statusText}`);
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      const filename = req.query.filename as string || 'audio.mp3';
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename.replace(/\.[^/.]+$/, "") + ".mp3")}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const readStream = new PassThrough();
      readStream.end(buffer);

      ffmpeg()
        .input(readStream)
        .toFormat('mp3')
        .on('error', (err) => {
           console.error('FFmpeg error:', err);
           if (!res.headersSent) res.status(500).send('Conversion error');
        })
        .pipe(res, { end: true });

    } catch (err) {
      console.error('Convert proxy error:', err);
      if (!res.headersSent) res.status(500).send('Error proxying request');
    }
  });

  app.get("/api/proxy-download", async (req, res) => {
    const fileUrl = req.query.url as string;
    
    if (!fileUrl) {
      return res.status(400).send("URL parameter is required");
    }

    try {
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      
      const filename = req.query.filename as string;
      if (filename) {
        // Use double quotes for the filename, and encode special characters.
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      } else {
        res.setHeader('Content-Disposition', 'attachment');
      }
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.end(buffer);
    } catch (err) {
      console.error('Proxy error:', err);
      res.status(500).send('Error proxying request');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
