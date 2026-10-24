const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const out = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'script.js', 'config.js'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of files) {
  const from = path.join(root, file);
  const to = path.join(out, file);
  if (!fs.existsSync(from)) throw new Error(`Required website file is missing: ${file}`);
  fs.copyFileSync(from, to);
}
console.log(`Built the static birthday website into ${path.relative(root, out)}/`);
console.log(`Copied ${files.length} site files. No packages or API keys are required.`);
