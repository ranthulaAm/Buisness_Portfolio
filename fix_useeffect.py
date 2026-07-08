import sys
content = open("pages/Order.tsx").read()

old_use_effect = """  useEffect(() => {
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

new_use_effect = """  const startedUploadsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;
    
    formData.files.forEach(f => {
        if (!startedUploadsRef.current.has(f.name)) {
            startedUploadsRef.current.add(f.name);
            setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
            const path = `${user.id}/uploads/${currentOrderId}/client_uploads/${f.name}`;
            uploadFileWithProgress(f, path, (p) => {
                if (startedUploadsRef.current.has(f.name)) {
                    setUploadProgress(prev => ({ ...prev, [f.name]: p }));
                }
            }).then(url => {
                if (startedUploadsRef.current.has(f.name)) {
                    setUploadedUrls(prev => ({ ...prev, [f.name]: url }));
                }
            }).catch(console.error);
        }
    });

    formData.voiceClips.forEach(v => {
        if (!startedUploadsRef.current.has(v.name)) {
            startedUploadsRef.current.add(v.name);
            setUploadProgress(prev => ({ ...prev, [v.name]: 0 }));
            const path = `${user.id}/uploads/${currentOrderId}/client_uploads/voice_notes/${v.name}.webm`;
            uploadFileWithProgress(v.blob, path, (p) => {
                if (startedUploadsRef.current.has(v.name)) {
                    setUploadProgress(prev => ({ ...prev, [v.name]: p }));
                }
            }).then(url => {
                if (startedUploadsRef.current.has(v.name)) {
                    setUploadedUrls(prev => ({ ...prev, [v.name]: url }));
                }
            }).catch(console.error);
        }
    });
  }, [formData.files, formData.voiceClips, user, currentOrderId]);"""

if old_use_effect in content:
    content = content.replace(old_use_effect, new_use_effect)
    print("Replaced useEffect")

old_remove_voice = """  const removeVoiceClip = (index: number) => {
    setFormData(prev => {
      const clip = prev.voiceClips[index];
      if (clip && clip.url) URL.revokeObjectURL(clip.url);
      if (clip) {
        setUploadProgress(p => { const newP = { ...p }; delete newP[clip.name]; return newP; });
        setUploadedUrls(u => { const newU = { ...u }; delete newU[clip.name]; return newU; });
      }
      return { ...prev, voiceClips: prev.voiceClips.filter((_, i) => i !== index) };
    });
  };"""

new_remove_voice = """  const removeVoiceClip = (index: number) => {
    setFormData(prev => {
      const clip = prev.voiceClips[index];
      if (clip && clip.url) URL.revokeObjectURL(clip.url);
      if (clip) {
        startedUploadsRef.current.delete(clip.name);
        setUploadProgress(p => { const newP = { ...p }; delete newP[clip.name]; return newP; });
        setUploadedUrls(u => { const newU = { ...u }; delete newU[clip.name]; return newU; });
      }
      return { ...prev, voiceClips: prev.voiceClips.filter((_, i) => i !== index) };
    });
  };"""

if old_remove_voice in content:
    content = content.replace(old_remove_voice, new_remove_voice)
    print("Replaced removeVoiceClip")

old_remove_file = """  const removeFile = (index: number) => {
    setFormData(prev => {
        const file = prev.files[index];
        if (file) {
            setUploadProgress(p => { const newP = { ...p }; delete newP[file.name]; return newP; });
            setUploadedUrls(u => { const newU = { ...u }; delete newU[file.name]; return newU; });
        }
        return {
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        };
    });
  };"""

new_remove_file = """  const removeFile = (index: number) => {
    setFormData(prev => {
        const file = prev.files[index];
        if (file) {
            startedUploadsRef.current.delete(file.name);
            setUploadProgress(p => { const newP = { ...p }; delete newP[file.name]; return newP; });
            setUploadedUrls(u => { const newU = { ...u }; delete newU[file.name]; return newU; });
        }
        return {
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        };
    });
  };"""

if old_remove_file in content:
    content = content.replace(old_remove_file, new_remove_file)
    print("Replaced removeFile")

open("pages/Order.tsx", "w").write(content)
