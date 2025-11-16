const version = process.env.npm_package_version;
const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

const main = () => {
  const manifest = JSON.parse(readFileSync(join(__dirname, 'public', 'manifest.json'), 'utf8'));
  manifest.version = version;
  writeFileSync(join(__dirname, 'public', 'manifest.json'), JSON.stringify(manifest, null, 2));
}

main();