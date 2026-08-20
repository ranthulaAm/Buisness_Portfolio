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

  // Enable JSON body parsing for API endpoints
  app.use(express.json({ limit: "100kb" }));

  // In-memory rate limiting map for notifications (IP -> timestamps[])
  const rateLimitMap = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 20;

  const isRateLimited = (ip: string): boolean => {
    const now = Date.now();
    const timestamps = (rateLimitMap.get(ip) || []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      rateLimitMap.set(ip, timestamps);
      return true;
    }
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return false;
  };

  // Secure server-side Telegram Notification endpoint
  app.post("/api/telegram-notify", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";

    if (isRateLimited(clientIp)) {
      return res.status(429).json({ error: "Too many notification requests. Please try again later." });
    }

    const { type, message, payload } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid notification message" });
    }

    // Sanitize and limit message length to prevent spam abuse
    const trimmedMessage = message.trim().slice(0, 2000);
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const defaultBotToken = "8312949734:AAF5_Jax7u6sMP6tpOr3Xw7lPZRleLDp1PA";
    const defaultChatId = "8072420741";

    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    const envChatId = process.env.TELEGRAM_CHAT_ID;

    // Validate bot token format (must contain ':' and be sufficient length)
    const botToken = (envToken && envToken.includes(":") && envToken.length > 25)
      ? envToken
      : defaultBotToken;

    // Validate chat ID format
    const chatId = (envChatId && envChatId.length > 5 && envChatId !== "3963")
      ? envChatId
      : defaultChatId;

    if (!botToken || !chatId) {
      console.warn("Telegram bot token or chat ID is missing");
      return res.status(500).json({ error: "Telegram service is not configured" });
    }

    try {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: trimmedMessage,
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Telegram API response error:", errorText);
        return res.status(response.status).json({ error: "Failed to send notification via Telegram" });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Error sending Telegram message from server:", error);
      return res.status(500).json({ error: "Internal server error sending notification" });
    }
  });

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
