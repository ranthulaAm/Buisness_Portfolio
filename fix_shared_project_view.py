import sys
import re

content = open("pages/SharedProjectView.tsx").read()

if "import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';" not in content:
    content = content.replace("import JSZip from 'jszip';", "import JSZip from 'jszip';\nimport { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';")

pattern = r'  const handleDownloadAll = async \(\) => \{.*?  const handleSingleDownload = async \(.*?\}\n  \};\n'
match = re.search(pattern, content, flags=re.DOTALL)

if match:
    new_code = """  const handleDownloadAll = async () => {
    if (!project || project.files.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadTotal(project.files.length);
    
    await handleBulkDownload(
      project.files.map(f => ({ url: f.url, name: f.name })),
      `${project.clientName.replace(/\s+/g, '_')}_Files`,
      (prog) => setDownloadProgress(prog)
    );
    setIsDownloading(false);
  };
"""
    content = content.replace(match.group(0), new_code)
    open("pages/SharedProjectView.tsx", "w").write(content)
    print("Replaced download helpers in SharedProjectView.tsx using regex")
else:
    print("Could not find regex match")

