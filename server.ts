import express from "express";
import path from "path";
import https from "https";
import http from "http";
import { Readable } from "stream";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy endpoint to bypass CORS for file downloads
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
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (response.body) {
        Readable.fromWeb(response.body as any).pipe(res);
      } else {
        res.end();
      }
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
