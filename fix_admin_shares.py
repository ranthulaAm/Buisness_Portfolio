import sys
import re

content = open("components/AdminShares.tsx").read()

old_fn = re.search(r'  const handleFileUpload = async.*?e\.target\.value = "";\n  \};', content, flags=re.DOTALL)

if old_fn:
    new_fn = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const filesToUpload = Array.from(e.target.files);
    
    const validFiles: File[] = [];
    const MAX_SIZE_MB = 1000;
    const BLOCKED_TYPES = ["application/x-msdownload", "application/x-sh", "application/x-bat", "application/x-executable"];
    
    for (const f of filesToUpload) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File ${f.name} exceeds ${MAX_SIZE_MB}MB limit.`);
        continue;
      }
      if (BLOCKED_TYPES.includes(f.type) || f.name.match(/\.(exe|bat|sh|cmd)$/i)) {
        alert(`File ${f.name} has an unsupported file type.`);
        continue;
      }
      validFiles.push(f);
    }
    
    if (validFiles.length === 0) return;
    
    try {
      const uploadPromises = validFiles.map(async (file) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        try {
          const uploadedFile = await uploadShareFile(projectId, file, (prog) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: prog }));
          });
          return uploadedFile;
        } catch (err) {
          console.error("Upload failed for file " + file.name, err);
          alert(`Failed to upload ${file.name}`);
          return null;
        } finally {
          setUploadProgress(prev => {
            const newProg = { ...prev };
            delete newProg[file.name];
            return newProg;
          });
        }
      });
      
      const newUploadedFiles = await Promise.all(uploadPromises);
      const successfulFiles = newUploadedFiles.filter(Boolean) as any[];
      
      if (successfulFiles.length > 0) {
        const currentFiles = [...project.files, ...successfulFiles];
        await updateSharedProject(projectId, { files: currentFiles });
      }
    } catch (err) {
      console.error("Upload process error", err);
    }
    
    e.target.value = "";
  };"""
    content = content.replace(old_fn.group(0), new_fn)
    open("components/AdminShares.tsx", "w").write(content)
    print("Replaced handleFileUpload")
else:
    print("Not found")
