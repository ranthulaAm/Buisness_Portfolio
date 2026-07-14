import sys

with open("pages/Order.tsx", "r") as f:
    content = f.read()

# Add import
content = content.replace("import imageCompression from 'browser-image-compression';", "import imageCompression from 'browser-image-compression';\nimport { convertToMp3 } from '../utils/audioConverter';")

# Add state
content = content.replace("const [isRecording, setIsRecording] = useState(false);", "const [isRecording, setIsRecording] = useState(false);\n  const [isConverting, setIsConverting] = useState(false);")

# Update onstop
old_onstop = """      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setFormData(prev => ({ ...prev, voiceClips: [...prev.voiceClips, { blob, url, name: `Voice Note ${prev.voiceClips.length + 1}` }] }));
      };"""
new_onstop = """      mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
           setIsConverting(true);
           const mp3Blob = await convertToMp3(rawBlob);
           const url = URL.createObjectURL(mp3Blob);
           setFormData(prev => ({ ...prev, voiceClips: [...prev.voiceClips, { blob: mp3Blob, url, name: `Voice Note ${prev.voiceClips.length + 1}.mp3` }] }));
        } catch (e) {
           console.error("Audio conversion failed", e);
           const url = URL.createObjectURL(rawBlob);
           setFormData(prev => ({ ...prev, voiceClips: [...prev.voiceClips, { blob: rawBlob, url, name: `Voice Note ${prev.voiceClips.length + 1}.webm` }] }));
        } finally {
           setIsConverting(false);
        }
      };"""
content = content.replace(old_onstop, new_onstop)

# Update UI for converting
content = content.replace("{isRecording && <span className=\"text-pink-500 text-xs font-bold animate-pulse\">Recording...</span>}", "{isRecording && <span className=\"text-pink-500 text-xs font-bold animate-pulse\">Recording...</span>}{isConverting && <span className=\"text-purple-500 text-xs font-bold animate-pulse\">Converting to MP3...</span>}")

with open("pages/Order.tsx", "w") as f:
    f.write(content)
