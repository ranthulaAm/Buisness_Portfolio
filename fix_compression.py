import sys
import re

content = open("pages/Order.tsx").read()

if "import imageCompression" not in content:
    content = content.replace("import { OfferBanner } from '../components/OfferBanner';", "import { OfferBanner } from '../components/OfferBanner';\nimport imageCompression from 'browser-image-compression';")

old_code = """              setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
              try {
                  const path = `${user.id}/uploads/${orderId}/client_uploads/${f.name}`;
                  const url = await uploadFileWithProgress(f, path, (p) => {
                      setUploadProgress(prev => ({ ...prev, [f.name]: p }));
                  });"""
                  
new_code = """              setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
              try {
                  let fileToUpload = f;
                  if (f.type.startsWith('image/') && !f.type.includes('gif')) {
                      try {
                          const options = {
                              maxSizeMB: 2,
                              maxWidthOrHeight: 1920,
                              useWebWorker: true
                          };
                          fileToUpload = await imageCompression(f as File, options);
                      } catch (e) {
                          console.warn('Image compression failed, using original file', e);
                      }
                  }
                  
                  const path = `${user.id}/uploads/${orderId}/client_uploads/${f.name}`;
                  const url = await uploadFileWithProgress(fileToUpload, path, (p) => {
                      setUploadProgress(prev => ({ ...prev, [f.name]: p }));
                  });"""

if old_code in content:
    content = content.replace(old_code, new_code)
    open("pages/Order.tsx", "w").write(content)
    print("Replaced Order.tsx compression inside handleSubmit")
else:
    print("Not found old_code in Order.tsx")

