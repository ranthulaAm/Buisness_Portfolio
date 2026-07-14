import sys

content = open("pages/AdminDashboard.tsx").read()

if "import imageCompression" not in content:
    content = content.replace("import { uploadFileWithProgress } from '../services/fileUploadService';", "import { uploadFileWithProgress } from '../services/fileUploadService';\nimport imageCompression from 'browser-image-compression';")

# Add watermark utility function before the component
watermark_util = """const addWatermark = (file: File, watermarkText: string = "DRAFT"): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/') || file.type.includes('gif')) {
            resolve(file);
            return;
        }
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(file);
            ctx.drawImage(img, 0, 0);
            ctx.font = `bold ${Math.floor(canvas.width / 10)}px sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(watermarkText, 0, 0);
            for(let i = -2; i <= 2; i++) {
                for(let j = -2; j <= 2; j++) {
                    if (i === 0 && j === 0) continue;
                    ctx.fillText(watermarkText, i * canvas.width/2, j * canvas.height/2);
                }
            }
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], file.name, { type: file.type }));
                } else {
                    resolve(file);
                }
            }, file.type, 0.9);
            URL.revokeObjectURL(objUrl);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objUrl);
            resolve(file);
        };
        img.src = objUrl;
    });
};

export const AdminDashboard: React.FC = () => {"""

if "const addWatermark = " not in content:
    content = content.replace("export const AdminDashboard: React.FC = () => {", watermark_util)

# Now replace draft upload
old_draft_code = """      const path = `${selectedOrder.clientId}/uploads/${selectedOrder.id}/drafts/${Date.now()}_${file.name}`;
      try {
          const url = await uploadFileWithProgress(file, path, (p) => {
            setUploadProgress(prev => ({ ...prev, draft: p }));
          });"""

new_draft_code = """      try {
          let fileToUpload = file;
          if (fileToUpload.type.startsWith('image/') && !fileToUpload.type.includes('gif')) {
              try {
                  const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
                  fileToUpload = await imageCompression(fileToUpload, options) as File;
                  fileToUpload = await addWatermark(fileToUpload, "DRAFT");
              } catch(e) {
                  console.warn("Compression/Watermark failed", e);
              }
          }
          const path = `${selectedOrder.clientId}/uploads/${selectedOrder.id}/drafts/${Date.now()}_${fileToUpload.name || 'image'}`;
          const url = await uploadFileWithProgress(fileToUpload, path, (p) => {
            setUploadProgress(prev => ({ ...prev, draft: p }));
          });"""

if old_draft_code in content:
    content = content.replace(old_draft_code, new_draft_code)
    print("Replaced draft upload")

# Replace final asset upload
old_final_code = """        try {
          const path = `${selectedOrder.clientId}/uploads/${selectedOrder.id}/final_assets/${Date.now()}_${f.name}`;
          const url = await uploadFileWithProgress(f, path, (p) => {
            setUploadProgress(prev => ({ ...prev, [f.name]: p }));
          });"""

new_final_code = """        try {
          let fileToUpload = f;
          if (fileToUpload.type.startsWith('image/') && !fileToUpload.type.includes('gif')) {
              try {
                  const options = { maxSizeMB: 5, maxWidthOrHeight: 3840, useWebWorker: true };
                  fileToUpload = await imageCompression(fileToUpload, options) as File;
              } catch(e) {
                  console.warn("Compression failed", e);
              }
          }
          const path = `${selectedOrder.clientId}/uploads/${selectedOrder.id}/final_assets/${Date.now()}_${fileToUpload.name || 'image'}`;
          const url = await uploadFileWithProgress(fileToUpload, path, (p) => {
            setUploadProgress(prev => ({ ...prev, [f.name]: p }));
          });"""

if old_final_code in content:
    content = content.replace(old_final_code, new_final_code)
    print("Replaced final upload")

open("pages/AdminDashboard.tsx", "w").write(content)

