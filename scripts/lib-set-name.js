// Sets the npm package name in package.json and package-lock.json.
//   node scripts/lib-set-name.js <dir> <name>
const fs = require('fs');
const [dir, name] = process.argv.slice(2);
for (const file of ['package.json', 'package-lock.json']) {
  const path = `${dir}/${file}`;
  if (!fs.existsSync(path)) continue;
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));
  json.name = name;
  if (json.packages && json.packages['']) json.packages[''].name = name;
  fs.writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
}
