import sys
import re

content = open("pages/SharedProjectView.tsx").read()

old_fn = re.search(r'  const handleDownloadAll = async \(\) => \{.*?\n  \};', content, flags=re.DOTALL)

if old_fn:
    new_fn = """  const handleDownloadAll = async () => {
    if (!project || project.files.length === 0) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadTotal(project.files.length);
    try {
      const zip = new JSZip();
      
      const downloadPromises = project.files.map(async (file) => {
        try {
          let response;
          try {
            response = await fetch(`/api/proxy-download?url=${encodeURIComponent(file.url)}`);
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
          setDownloadProgress(prev => prev + 1);
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
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.clientName.replace(/\s+/g, '_')}_Files.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading files:', error);
      alert('There was an error downloading the files. Try disabling adblock or downloading individually.');
    } finally {
      setIsDownloading(false);
    }
  };"""
    content = content.replace(old_fn.group(0), new_fn)
    open("pages/SharedProjectView.tsx", "w").write(content)
    print("Replaced handleDownloadAll")
else:
    print("Not found")
