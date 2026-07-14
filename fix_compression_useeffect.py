import sys
content = open("pages/Order.tsx").read()

old_code = """    formData.files.forEach(f => {
        if (!startedUploadsRef.current.has(f.name)) {
            startedUploadsRef.current.add(f.name);
            setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
            const path = `${user.id}/uploads/${currentOrderId}/client_uploads/${f.name}`;
            uploadFileWithProgress(f, path, (p) => {"""

new_code = """    formData.files.forEach(async (f) => {
        if (!startedUploadsRef.current.has(f.name)) {
            startedUploadsRef.current.add(f.name);
            setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
            
            let fileToUpload: File | Blob = f;
            if (f.type && f.type.startsWith('image/') && !f.type.includes('gif')) {
                try {
                    const options = { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true };
                    fileToUpload = await imageCompression(f as File, options);
                } catch (e) {
                    console.warn('Image compression failed', e);
                }
            }
            
            const path = `${user.id}/uploads/${currentOrderId}/client_uploads/${f.name}`;
            uploadFileWithProgress(fileToUpload, path, (p) => {"""

if old_code in content:
    content = content.replace(old_code, new_code)
    open("pages/Order.tsx", "w").write(content)
    print("Replaced useEffect compression")
else:
    print("Not found old_code")
