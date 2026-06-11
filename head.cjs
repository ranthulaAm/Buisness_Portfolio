const { execSync } = require('child_process');
try {
  let out = execSync('head -n 122 /tmp/repo/src/hooks/usePortfolioData.ts').toString();
  console.log(out);
} catch (e) {
  console.log(e.message);
}
