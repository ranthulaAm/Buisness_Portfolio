const { execSync } = require('child_process');
try {
  let out = execSync('grep -ri "education" /tmp/repo/src').toString();
  console.log(out);
} catch (e) {
  console.log(e.message);
}
