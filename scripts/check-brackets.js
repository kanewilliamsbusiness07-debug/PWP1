const fs = require('fs');
const path = process.argv[2] || 'lib/pdf/pdf-generator.tsx';
const content = fs.readFileSync(path, 'utf8');
function findMismatch(charsOpen, charsClose) {
  const stack = [];
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (charsOpen.includes(ch)) stack.push({ch, i});
    const idx = charsClose.indexOf(ch);
    if (idx !== -1) {
      if (stack.length === 0) return {pos: i, ch};
      stack.pop();
    }
  }
  if (stack.length) return {pos: stack[stack.length-1].i, ch: stack[stack.length-1].ch};
  return null;
}
console.log('Checking file:', path);
let res = findMismatch(['('], [')']);
if (res) console.log('Paren mismatch at index', res.pos, 'char', content[res.pos-10>0?res.pos-10:0, res.pos+10]);
else console.log('Parentheses balanced');
res = findMismatch(['{'], ['}']);
if (res) {
  const pos = res.pos;
  const start = Math.max(0, pos - 40);
  const ctx = content.slice(start, Math.min(content.length, pos + 40)).replace(/\n/g, '\\n');
  console.log('Brace mismatch at index', pos, 'context:', ctx);
} else console.log('Braces balanced');
res = findMismatch(['['], [']']);
if (res) console.log('Bracket mismatch at index', res.pos);
else console.log('Brackets balanced');
