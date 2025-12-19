const fs = require('fs');
const s = fs.readFileSync('app/(dashboard)/client-information/client-form.tsx','utf8');
let paren=0, brace=0, bracket=0;
const lines = s.split('\n');
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  for(let ch of line){
    if(ch==='(') paren++;
    if(ch===')') paren--;
  if(ch==='{' ) brace++;
  if(ch==='}') brace--;
  if(ch==='[') bracket++;
    if(ch===']') bracket--;
  }
  if(paren<0||brace<0||bracket<0){
    console.log('Negative balance at line',i+1, 'paren',paren,'brace',brace,'bracket',bracket);
    break;
  }
}
console.log('Final balances:','paren',paren,'brace',brace,'bracket',bracket);
// Now compute div tag cumulative balance
let linesArr = s.split('\n');
let cum=0, maxCum=0, maxLine=0;
for(let i=0;i<linesArr.length;i++){
  const l = linesArr[i];
  const opens = (l.match(/<div\b/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  cum += opens - closes;
  if(cum>maxCum){ maxCum=cum; maxLine=i+1 }
}
console.log('Div balance end:', cum, 'maxCum at line', maxLine);
const fs = require('fs');
const s = fs.readFileSync('app/(dashboard)/client-information/client-form.tsx','utf8');

// Check parentheses, braces, brackets balance
let paren=0, brace=0, bracket=0;
const lines = s.split('\n');
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  for(let ch of line){
    if(ch==='(') paren++;
    if(ch===')') paren--;
    if(ch==='{' ) brace++;
    if(ch==='}') brace--;
    if(ch==='[') bracket++;
    if(ch===']') bracket--;
  }
  if(paren<0||brace<0||bracket<0){
    console.log('Negative balance at line',i+1, 'paren',paren,'brace',brace,'bracket',bracket);
    break;
  }
}
console.log('Final balances:','paren',paren,'brace',brace,'bracket',bracket);

// Now compute div tag cumulative balance
let linesArr = s.split('\n');
let cum=0, maxCum=0, maxLine=0;
for(let i=0;i<linesArr.length;i++){
  const l = linesArr[i];
  const opens = (l.match(/<div\b/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  cum += opens - closes;
  if(cum>maxCum){ maxCum=cum; maxLine=i+1 }
}
console.log('Div balance end:', cum, 'maxCum at line', maxLine);
const fs = require('fs');
const s = fs.readFileSync('app/(dashboard)/client-information/client-form.tsx','utf8');
let paren=0, brace=0, bracket=0;
const lines = s.split('\n');
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  for(let ch of line){
    if(ch==='(') paren++;
    if(ch===')') paren--;
    if(ch==='{' ) brace++;
    if(ch==='}') brace--;
    if(ch==='[') bracket++;
    if(ch===']') bracket--;
  }
  if(paren<0||brace<0||bracket<0){
    console.log('Negative balance at line',i+1, 'paren',paren,'brace',brace,'bracket',bracket);
    break;
  }
}
console.log('Final balances:','paren',paren,'brace',brace,'bracket',bracket);
