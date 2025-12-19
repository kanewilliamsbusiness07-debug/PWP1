const fs = require('fs');
const path = 'app/(dashboard)/client-information/client-form.tsx';
const s = fs.readFileSync(path, 'utf8').split('\n');
s.forEach((l, i) => {
  if (/<div\b|<div\s|<div>/.test(l) || /<\/div>/.test(l)) {
    console.log((i + 1) + ': ' + l);
  }
});
