import lamejs from 'lamejs';
import MPEGMode from 'lamejs/src/js/MPEGMode.js';
import Lame from 'lamejs/src/js/Lame.js';
import BitStream from 'lamejs/src/js/BitStream.js';

(global as any).MPEGMode = MPEGMode;
(global as any).Lame = Lame;
(global as any).BitStream = BitStream;

try {
  const encoder = new lamejs.Mp3Encoder(1, 44100, 128);
  const sampleBlockSize = 1152;
  const samples = new Int16Array(sampleBlockSize);
  encoder.encodeBuffer(samples);
  encoder.flush();
  console.log("Success encode");
} catch (e) {
  console.error("Failed encode:", e.stack);
}
