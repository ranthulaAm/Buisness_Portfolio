const fs = require('fs');
const path = require('path');

const dirsToMigrate = ['pages', 'components'];

const replacements = [
  { regex: /(?<!dark:)bg-white(?!\/)/g, rep: 'bg-white dark:bg-slate-900' },
  { regex: /(?<!dark:)bg-gray-50(?!\/)/g, rep: 'bg-gray-50 dark:bg-slate-800' },
  { regex: /(?<!dark:)bg-gray-100(?!\/)/g, rep: 'bg-gray-100 dark:bg-slate-800' },
  { regex: /(?<!dark:)text-gray-900/g, rep: 'text-gray-900 dark:text-slate-100' },
  { regex: /(?<!dark:)text-gray-800/g, rep: 'text-gray-800 dark:text-slate-200' },
  { regex: /(?<!dark:)text-gray-700/g, rep: 'text-gray-700 dark:text-slate-300' },
  { regex: /(?<!dark:)text-gray-600/g, rep: 'text-gray-600 dark:text-slate-400' },
  { regex: /(?<!dark:)border-gray-200/g, rep: 'border-gray-200 dark:border-slate-700' },
  { regex: /(?<!dark:)border-gray-100/g, rep: 'border-gray-100 dark:border-slate-700' },
  { regex: /(?<!dark:)border-gray-300/g, rep: 'border-gray-300 dark:border-slate-600' },
  { regex: /(?<!dark:)bg-white\/80/g, rep: 'bg-white/80 dark:bg-slate-900/80' },
  { regex: /(?<!dark:)bg-white\/90/g, rep: 'bg-white/90 dark:bg-slate-900/90' },
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
