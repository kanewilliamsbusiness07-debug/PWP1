#!/usr/bin/env node

/**
 * YAML Validation Script
 * 
 * Validates all YAML files in the repository to ensure:
 * 1. They are valid YAML syntax
 * 2. Commands in buildspec/amplify.yml are properly quoted
 * 3. No unescaped colons in command values
 * 
 * Usage: node scripts/validate-yaml.js
 * 
 * Requires: js-yaml (install with: npm install --save-dev js-yaml)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Reserved YAML characters that require quoting in commands
const RESERVED_CHARS = /[:#{}[\]&*?|>!%@]/;
const COMMAND_OPERATORS = /(\|\||&&|;)/;

// Files to check
const YAML_FILES = [
  'amplify.yml',
  'buildspec.yml',
  'aws-buildspec.yml',
  'docker-compose.yml'
];

// Directories to search recursively
const SEARCH_DIRS = ['.'];

let hasErrors = false;
const errors = [];

/**
 * Recursively find all YAML files
 */
function findYamlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, and other common ignore dirs
      if (!['node_modules', '.git', '.next', 'dist', 'build', 'out'].includes(file)) {
        findYamlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Check if a command needs quoting
 */
function needsQuoting(command) {
  if (typeof command !== 'string') return false;
  
  // Check for reserved characters or operators
  return RESERVED_CHARS.test(command) || COMMAND_OPERATORS.test(command);
}

/**
 * Validate commands in a YAML structure
 */
function validateCommands(obj, filePath, path = '') {
  if (typeof obj !== 'object' || obj === null) return;
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = path ? `${path}[${index}]` : `[${index}]`;
      
      if (typeof item === 'string' && path.includes('commands')) {
        // This is a command in a commands array
        if (needsQuoting(item)) {
          // Check if it's already quoted in the source
          const sourceLines = fs.readFileSync(filePath, 'utf8').split('\n');
          const lineNum = findLineNumber(sourceLines, item);
          
          if (lineNum >= 0) {
            const line = sourceLines[lineNum];
            // Check if line starts with quoted string
            if (!line.match(/^\s*-\s*['"]/)) {
              errors.push({
                file: filePath,
                line: lineNum + 1,
                path: currentPath,
                command: item,
                issue: 'Command contains reserved YAML characters and should be quoted'
              });
              hasErrors = true;
            }
          }
        }
      } else {
        validateCommands(item, filePath, currentPath);
      }
    });
  } else {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key === 'commands' && Array.isArray(value)) {
        validateCommands(value, filePath, currentPath);
      } else {
        validateCommands(value, filePath, currentPath);
      }
    });
  }
}

/**
 * Find line number of a string in source lines
 */
function findLineNumber(lines, searchString) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i;
    }
  }
  return -1;
}

/**
 * Main validation function
 */
function validateYamlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Preprocess CloudFormation intrinsic tags (e.g., !Ref, !Sub, !GetAtt) so js-yaml
    // can parse CloudFormation templates without failing on unknown tags. We only
    // perform this transformation for files inside `infrastructure/` (CF templates).
    let contentToParse = content;
    if (filePath.includes('infrastructure') && /!\b(Ref|Sub|GetAtt|Join|FindInMap|GetAZs|Select|Split|ImportValue|Cidr)\b/.test(content)) {
      contentToParse = content.replace(/^([ \t]*[^:\n]+:\s*)!(\w+)\s+([^\n]+)/gm,
        (m, prefix, tag, rest) => `${prefix}'!${tag} ${rest.replace(/'/g, "''")}'`
      );
    }

    const doc = yaml.load(contentToParse);
    
    // Validate commands in buildspec/amplify files
    if (filePath.includes('amplify.yml') || filePath.includes('buildspec')) {
      validateCommands(doc, filePath);
    }
    
    console.log(`✓ ${filePath} - Valid YAML`);
  } catch (error) {
    console.error(`✗ ${filePath} - YAML Parse Error: ${error.message}`);
    errors.push({
      file: filePath,
      line: error.mark?.line || 0,
      issue: `YAML Parse Error: ${error.message}`
    });
    hasErrors = true;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Validating YAML files...\n');
  
  // Check if js-yaml is available
  try {
    require.resolve('js-yaml');
  } catch (e) {
    console.error('ERROR: js-yaml is not installed.');
    console.error('Install it with: npm install --save-dev js-yaml');
    process.exit(1);
  }
  
  // Find all YAML files
  const yamlFiles = [];
  SEARCH_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      findYamlFiles(dir, yamlFiles);
    }
  });
  
  // Also check specific files
  YAML_FILES.forEach(file => {
    if (fs.existsSync(file) && !yamlFiles.includes(file)) {
      yamlFiles.push(file);
    }
  });
  
  if (yamlFiles.length === 0) {
    console.log('No YAML files found.');
    return;
  }
  
  // Validate each file
  yamlFiles.forEach(validateYamlFile);
  
  // Report results
  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    console.error('\n✗ Validation failed with errors:\n');
    errors.forEach(error => {
      console.error(`  File: ${error.file}`);
      if (error.line) console.error(`  Line: ${error.line}`);
      if (error.path) console.error(`  Path: ${error.path}`);
      if (error.command) console.error(`  Command: ${error.command}`);
      console.error(`  Issue: ${error.issue}\n`);
    });
    process.exit(1);
  } else {
    console.log('\n✓ All YAML files are valid and properly formatted.');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { validateYamlFile, needsQuoting };

