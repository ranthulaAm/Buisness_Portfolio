import sys
content = open("pages/Order.tsx").read()

old_remove_voice = """  const removeVoiceClip = (index: number) => {
    setFormData(prev => {
      const clip = prev.voiceClips[index];
      if (clip && clip.url) URL.revokeObjectURL(clip.url);
      return { ...prev, voiceClips: prev.voiceClips.filter((_, i) => i !== index) };
    });
  };"""

new_remove_voice = """  const removeVoiceClip = (index: number) => {
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

content = content.replace(old_remove_voice, new_remove_voice)

old_remove_file = """  const removeFile = (index: number) => {
    setFormData(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
    }));
  };"""

new_remove_file = """  const removeFile = (index: number) => {
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

content = content.replace(old_remove_file, new_remove_file)

open("pages/Order.tsx", "w").write(content)
print("Done!")
