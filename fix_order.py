import sys
content = open("pages/Order.tsx").read()

old_state = "const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});"
new_state = """const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadedUrls, setUploadedUrls] = useState<{ [key: string]: string }>({});
  const [currentOrderId] = useState(() => searchParams.get('edit') || generateOrderId());

  useEffect(() => {
    if (!user) return;
    
    formData.files.forEach(f => {
        if (uploadProgress[f.name] === undefined) {
            setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
            const path = `${user.id}/uploads/${currentOrderId}/client_uploads/${f.name}`;
            uploadFileWithProgress(f, path, (p) => {
                setUploadProgress(prev => ({ ...prev, [f.name]: p }));
            }).then(url => {
                setUploadedUrls(prev => ({ ...prev, [f.name]: url }));
            }).catch(console.error);
        }
    });

    formData.voiceClips.forEach(v => {
        if (uploadProgress[v.name] === undefined) {
            setUploadProgress(prev => ({ ...prev, [v.name]: 0 }));
            const path = `${user.id}/uploads/${currentOrderId}/client_uploads/voice_notes/${v.name}.webm`;
            uploadFileWithProgress(v.blob, path, (p) => {
                setUploadProgress(prev => ({ ...prev, [v.name]: p }));
            }).then(url => {
                setUploadedUrls(prev => ({ ...prev, [v.name]: url }));
            }).catch(console.error);
        }
    });
  }, [formData.files, formData.voiceClips, user, currentOrderId, uploadProgress]);"""

if old_state in content:
    content = content.replace(old_state, new_state)
    print("Replaced state")

old_submit = """      const orderId = editOrderId || generateOrderId();
      
      // Client-side validation and sequential upload to prevent freezing
      const MAX_SIZE_MB = 1000;
      const BLOCKED_TYPES = ["application/x-msdownload", "application/x-sh", "application/x-bat", "application/x-executable"];
      
      const validFiles = [];
      for (const f of formData.files) {
          if (f.size > MAX_SIZE_MB * 1024 * 1024) {
              alert(`File ${f.name} exceeds ${MAX_SIZE_MB}MB limit.`);
              continue;
          }
          if (BLOCKED_TYPES.includes(f.type) || f.name.match(/\.(exe|bat|sh|cmd)$/i)) {
              alert(`File ${f.name} has an unsupported file type.`);
              continue;
          }
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

      const validVoiceClips = [];
      for (const v of formData.voiceClips) {
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
      }"""

new_submit = """      const orderId = currentOrderId;
      
      // Client-side validation and sequential upload to prevent freezing
      const MAX_SIZE_MB = 1000;
      const BLOCKED_TYPES = ["application/x-msdownload", "application/x-sh", "application/x-bat", "application/x-executable"];
      
      const validFiles = [];
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

if old_submit in content:
    content = content.replace(old_submit, new_submit)
    print("Replaced submit")
else:
    print("Submit block not found!")

# Also remove the `isSubmitting &&` from the visual presentation in JSX so the percentage always shows
old_jsx_file = """                        {isSubmitting && uploadProgress[f.name] !== undefined && (
                            <div className="absolute left-0 top-0 bottom-0 bg-purple-100 dark:bg-purple-900/20 transition-all duration-300 -z-0" style={{ width: `${uploadProgress[f.name]}%` }} />
                        )}
                        <Check size={16} className="text-green-500 z-10" />
                        <span className="truncate flex-1 z-10">{f.name}</span>
                        {isSubmitting && uploadProgress[f.name] !== undefined && (
                            <span className="text-purple-600 font-bold text-xs z-10">{Math.round(uploadProgress[f.name])}%</span>
                        )}"""

new_jsx_file = """                        {uploadProgress[f.name] !== undefined && (
                            <div className="absolute left-0 top-0 bottom-0 bg-purple-100 dark:bg-purple-900/20 transition-all duration-300 -z-0" style={{ width: `${uploadProgress[f.name]}%` }} />
                        )}
                        <Check size={16} className="text-green-500 z-10" />
                        <span className="truncate flex-1 z-10 text-sm font-medium">{f.name}</span>
                        {uploadProgress[f.name] !== undefined && (
                            <span className="text-purple-600 font-bold text-sm z-10">{Math.round(uploadProgress[f.name])}%</span>
                        )}"""

if old_jsx_file in content:
    content = content.replace(old_jsx_file, new_jsx_file)
    print("Replaced JSX file")

old_jsx_voice = """                    {isSubmitting && uploadProgress[clip.name] !== undefined && (
                        <div className="absolute left-0 top-0 bottom-0 bg-purple-100 dark:bg-purple-900/20 transition-all duration-300 -z-0" style={{ width: `${uploadProgress[clip.name]}%` }} />
                    )}
                    <div className="flex items-center gap-3 z-10"><Play size={14} className="text-purple-600" /><span className="text-sm font-medium text-gray-700 dark:text-slate-300">{clip.name}</span>
                    {isSubmitting && uploadProgress[clip.name] !== undefined && (
                        <span className="text-purple-600 font-bold text-xs">{Math.round(uploadProgress[clip.name])}%</span>
                    )}"""

new_jsx_voice = """                    {uploadProgress[clip.name] !== undefined && (
                        <div className="absolute left-0 top-0 bottom-0 bg-purple-100 dark:bg-purple-900/20 transition-all duration-300 -z-0" style={{ width: `${uploadProgress[clip.name]}%` }} />
                    )}
                    <div className="flex items-center gap-3 z-10"><Play size={14} className="text-purple-600" /><span className="text-sm font-medium text-gray-700 dark:text-slate-300">{clip.name}</span>
                    {uploadProgress[clip.name] !== undefined && (
                        <span className="text-purple-600 font-bold text-sm">{Math.round(uploadProgress[clip.name])}%</span>
                    )}"""

if old_jsx_voice in content:
    content = content.replace(old_jsx_voice, new_jsx_voice)
    print("Replaced JSX voice")

open("pages/Order.tsx", "w").write(content)
