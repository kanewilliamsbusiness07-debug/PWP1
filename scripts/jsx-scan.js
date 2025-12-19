const fs = require('fs');
const path = process.argv[2] || 'app/(dashboard)/client-information/client-form.tsx';
const s = fs.readFileSync(path, 'utf8');
function findMismatch() {
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s.slice(i, i+10);
    if (next.startsWith("/*")) { // skip block comment
      const end = s.indexOf('*/', i+2);
      if (end === -1) return {type:'comment', pos:i};
      i = end + 1; continue;
    }
    if (next.startsWith('//')) { // skip line comment
      const end = s.indexOf('\n', i+2);
      if (end === -1) break; i = end; continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') stack.push({ch, i});
    if (ch === '}' || ch === ')' || ch === ']') {
      if (!stack.length) return {type:'closing-without-opening', ch, i};
      const top = stack.pop();
      if ((top.ch === '{' && ch !== '}') || (top.ch === '(' && ch !== ')') || (top.ch === '[' && ch !== ']'))
        return {type:'mismatch', expected: match(top.ch), got: ch, pos:i, openPos: top.i};
    }
  }
  if (stack.length) return {type:'unclosed', open: stack[stack.length-1]};
  return {type:'ok'};
}
function match(c){return c==='{'?'}':c==='('?')':']'}
console.log(JSON.stringify(findMismatch(), null, 2));
