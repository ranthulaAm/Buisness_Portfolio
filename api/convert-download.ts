import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export default async function handler(req: any, res: any) {
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
}
