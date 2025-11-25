const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, '..', 'app', '(dashboard)');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/type="number"/g, 'type="text"');
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx')) {
      updateFile(fullPath);
    }
  });
}

processDirectory(dashboardDir);