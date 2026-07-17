import { toast } from "react-hot-toast";
import JSZip from 'jszip';

export const handleSingleDownload = async (url: string, filename: string) => {
  try {
    let response;
    try {
      
      const isAudio = filename.toLowerCase().endsWith('.webm') || filename.toLowerCase().endsWith('.wav') || filename.toLowerCase().endsWith('.m4a') || filename.toLowerCase().endsWith('.mp3');
      const apiEndpoint = isAudio ? '/api/convert-download' : '/api/proxy-download';
      response = await fetch(`${apiEndpoint}?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`);

      if (!response.ok) throw new Error("Local proxy failed");
    } catch (e) {
      try {
        response = await fetch(url);
        if (!response.ok) throw new Error("Direct fetch failed");
      } catch (e2) {
        response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error("Public proxy failed");
      }
    }
    
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Download failed:', error);
    window.open(url, '_blank');
  }
};

export const handleBulkDownload = async (
  files: { url: string; name: string }[],
  zipName: string,
  onProgress?: (progress: number, total: number) => void
) => {
  if (!files || files.length === 0) return;
  
  if (onProgress) onProgress(0, files.length);

  try {
    const zip = new JSZip();
    
    let downloadedCount = 0;
    
    const downloadPromises = files.map(async (file) => {
      try {
        let response;
        try {
          
          const isAudio = file.name.toLowerCase().endsWith('.webm') || file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.m4a') || file.name.toLowerCase().endsWith('.mp3');
          const apiEndpoint = isAudio ? '/api/convert-download' : '/api/proxy-download';
          response = await fetch(`${apiEndpoint}?url=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(file.name)}`);
          
          if (isAudio) {
              file.name = file.name.replace(/\.[^/.]+$/, "") + ".mp3";
          }

          if (!response.ok) throw new Error("Local proxy failed");
        } catch (e) {
          try {
            response = await fetch(file.url);
            if (!response.ok) throw new Error("Direct fetch failed");
          } catch (e2) {
            response = await fetch(`https://corsproxy.io/?${encodeURIComponent(file.url)}`);
            if (!response.ok) throw new Error("Public proxy failed");
          }
        }
        const blob = await response.blob();
        zip.file(file.name, blob);
        
        downloadedCount++;
        if (onProgress) onProgress(downloadedCount, files.length);
        
        return true;
      } catch (err) {
        console.error("Failed to download file:", file.name, err);
        return false;
      }
    });
    
    const results = await Promise.all(downloadPromises);
    const successfulFiles = results.filter(Boolean).length;
    
    if (successfulFiles === 0) throw new Error("Could not download any files");
    
    const content = await zip.generateAsync({ type: 'blob' });
    const objectUrl = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${zipName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Error downloading files:', error);
    toast('There was an error downloading the files. Try disabling adblock or downloading individually.');
  }
};
