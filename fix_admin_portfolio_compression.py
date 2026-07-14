import sys
content = open("components/AdminPortfolio.tsx").read()

if "import imageCompression" not in content:
    content = content.replace("import { uploadFileWithProgress } from '../services/fileUploadService';", "import { uploadFileWithProgress } from '../services/fileUploadService';\nimport imageCompression from 'browser-image-compression';")

old_code = """        try {
            const path = `portfolio/${Date.now()}_${file.name}`;
            const url = await uploadFileWithProgress(file, path, (p) => {"""

new_code = """        try {
            let fileToUpload = file;
            if (file.type.startsWith('image/') && !file.type.includes('gif')) {
                try {
                    const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
                    fileToUpload = await imageCompression(file, options) as File;
                } catch (e) {
                    console.warn('Image compression failed', e);
                }
            }
            const path = `portfolio/${Date.now()}_${fileToUpload.name || 'image'}`;
            const url = await uploadFileWithProgress(fileToUpload, path, (p) => {"""

if old_code in content:
    content = content.replace(old_code, new_code)
    open("components/AdminPortfolio.tsx", "w").write(content)
    print("Replaced AdminPortfolio compression")
else:
    print("Not found old_code in AdminPortfolio.tsx")
