const fs = require('fs');
const path = require('path');

const dirsToMigrate = ['pages', 'components'];

const replacements = [
  { regex: /(?<!dark:)text-gray-500/g, rep: 'text-gray-500 dark:text-slate-400' },
  { regex: /(?<!dark:)hover:bg-gray-100/g, rep: 'hover:bg-gray-100 dark:hover:bg-slate-700' },
  { regex: /(?<!dark:)hover:bg-gray-50/g, rep: 'hover:bg-gray-50 dark:hover:bg-slate-800' },
  { regex: /(?<!dark:)border-white/g, rep: 'border-white dark:border-slate-800' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  for (let rule of replacements) {
    content = content.replace(rule.regex, rule.rep);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function processDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (let file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

for (let dir of dirsToMigrate) {
  processDir(path.join(process.cwd(), dir));
}
processFile(path.join(process.cwd(), 'App.tsx'));
