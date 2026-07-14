import sys
content = open("components/AdminShares.tsx").read()

if "import imageCompression" not in content:
    content = content.replace("import { deleteFileFromUrl } from '../services/fileUploadService';", "import { deleteFileFromUrl } from '../services/fileUploadService';\nimport imageCompression from 'browser-image-compression';")

old_code = """      const uploadPromises = validFiles.map(async (file) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        try {
          const uploadedFile = await uploadShareFile(projectId, file, (prog) => {"""

new_code = """      const uploadPromises = validFiles.map(async (file) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        try {
          let fileToUpload = file;
          if (file.type.startsWith('image/') && !file.type.includes('gif')) {
              try {
                  const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
                  fileToUpload = await imageCompression(file, options) as File;
              } catch (e) {
                  console.warn('Image compression failed', e);
              }
          }
          const uploadedFile = await uploadShareFile(projectId, fileToUpload, (prog) => {"""

if old_code in content:
    content = content.replace(old_code, new_code)
    open("components/AdminShares.tsx", "w").write(content)
    print("Replaced AdminShares compression")
else:
    print("Not found old_code in AdminShares.tsx")
