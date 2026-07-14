import lamejs from 'lamejs';
import MPEGMode from 'lamejs/src/js/MPEGMode.js';
import Lame from 'lamejs/src/js/Lame.js';
import BitStream from 'lamejs/src/js/BitStream.js';

// Fix for lamejs missing global references when bundled
if (typeof window !== 'undefined') {
  (window as any).MPEGMode = MPEGMode;
  (window as any).Lame = Lame;
  (window as any).BitStream = BitStream;
}

export const convertToMp3 = async (blob: Blob): Promise<Blob> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const channelData = audioBuffer.getChannelData(0); // Use left channel for mono
  const sampleRate = audioBuffer.sampleRate;
  
  const samples = new Int16Array(channelData.length);
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // Mono, sampleRate, 128kbps
  const mp3Data: Int8Array[] = [];
  
  const sampleBlockSize = 1152;
  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
  }
  
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf));
  }
  
  return new Blob(mp3Data, { type: 'audio/mp3' });
};
