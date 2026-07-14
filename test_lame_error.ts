import * as lamejs from 'lamejs/lame.all.js';

try {
  const encoder = new lamejs.Mp3Encoder(1, 44100, 128);
  console.log("Success");
} catch (e) {
  console.error("Failed:", e.stack);
}
