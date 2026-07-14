import sys
content = open("pages/Order.tsx").read()

old_code = """      const validFiles = [];
      for (const f of formData.files) {
          if (f.size > MAX_SIZE_MB * 1024 * 1024) {
              alert(`File ${f.name} exceeds ${MAX_SIZE_MB}MB limit.`);
              continue;
          }
          if (BLOCKED_TYPES.includes(f.type) || f.name.match(/\.(exe|bat|sh|cmd)$/i)) {
              alert(`File ${f.name} has an unsupported file type.`);
              continue;
          }
          if (uploadedUrls[f.name]) {
              validFiles.push({ name: f.name, type: f.type, data: uploadedUrls[f.name] });
          } else {
              setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
              try {
                  const path = `${user.id}/uploads/${orderId}/client_uploads/${f.name}`;
                  const url = await uploadFileWithProgress(f, path, (p) => {
                      setUploadProgress(prev => ({ ...prev, [f.name]: p }));
                  });
                  validFiles.push({ name: f.name, type: f.type, data: url });
              } catch (err) {
                  console.error(`Failed to upload file ${f.name}:`, err);
              }
          }
      }

      const validVoiceClips = [];
      for (const v of formData.voiceClips) {
          if (uploadedUrls[v.name]) {
              validVoiceClips.push({ name: v.name, type: "audio/webm", data: uploadedUrls[v.name] });
          } else {
              setUploadProgress(prev => ({ ...prev, [v.name]: 0 }));
              try {
                  const path = `${user.id}/uploads/${orderId}/client_uploads/voice_notes/${v.name}.webm`;
                  const url = await uploadFileWithProgress(v.blob, path, (p) => {
                      setUploadProgress(prev => ({ ...prev, [v.name]: p }));
                  });
                  validVoiceClips.push({ name: v.name, type: "audio/webm", data: url });
              } catch (err) {
                  console.error("Voice note upload failed:", err);
              }
          }
      }"""

new_code = """      const uploadFilePromises = formData.files.map(async (f) => {
          if (f.size > MAX_SIZE_MB * 1024 * 1024) {
              alert(`File ${f.name} exceeds ${MAX_SIZE_MB}MB limit.`);
              return null;
          }
          if (BLOCKED_TYPES.includes(f.type) || f.name.match(/\.(exe|bat|sh|cmd)$/i)) {
              alert(`File ${f.name} has an unsupported file type.`);
              return null;
          }
          if (uploadedUrls[f.name]) {
              return { name: f.name, type: f.type, data: uploadedUrls[f.name] };
          } else {
              setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
              try {
                  const path = `${user.id}/uploads/${orderId}/client_uploads/${f.name}`;
                  const url = await uploadFileWithProgress(f, path, (p) => {
                      setUploadProgress(prev => ({ ...prev, [f.name]: p }));
                  });
                  return { name: f.name, type: f.type, data: url };
              } catch (err) {
                  console.error(`Failed to upload file ${f.name}:`, err);
                  return null;
              }
          }
      });
      
      const uploadVoicePromises = formData.voiceClips.map(async (v) => {
          if (uploadedUrls[v.name]) {
              return { name: v.name, type: "audio/webm", data: uploadedUrls[v.name] };
          } else {
              setUploadProgress(prev => ({ ...prev, [v.name]: 0 }));
              try {
                  const path = `${user.id}/uploads/${orderId}/client_uploads/voice_notes/${v.name}.webm`;
                  const url = await uploadFileWithProgress(v.blob, path, (p) => {
                      setUploadProgress(prev => ({ ...prev, [v.name]: p }));
                  });
                  return { name: v.name, type: "audio/webm", data: url };
              } catch (err) {
                  console.error("Voice note upload failed:", err);
                  return null;
              }
          }
      });

      const resolvedFiles = await Promise.all(uploadFilePromises);
      const resolvedVoiceClips = await Promise.all(uploadVoicePromises);

      const validFiles = resolvedFiles.filter(Boolean);
      const validVoiceClips = resolvedVoiceClips.filter(Boolean);"""

if old_code in content:
    content = content.replace(old_code, new_code)
    open("pages/Order.tsx", "w").write(content)
    print("Replaced!")
else:
    print("Not found")

