const fs = require('fs');
const content = fs.readFileSync('pages/Home.tsx', 'utf8');
const lines = content.split('\n');
const fixed = lines.slice(0, 31).concat(lines.slice(177)).join('\n');
fs.writeFileSync('pages/Home.tsx', fixed);
