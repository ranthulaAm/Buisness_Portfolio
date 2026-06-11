const { execSync } = require('child_process');
try {
  execSync('rm -rf /tmp/repo');
  execSync('git clone https://github.com/ranthulaAm/Portfolio_Web_App.git /tmp/repo');
  const out = execSync('ls -la /tmp/repo').toString();
  console.log(out);
  
  const src = execSync('ls -la /tmp/repo/src').toString();
  console.log('src:', src);
} catch (e) {
  console.log(e.message);
}
