const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname);

// Do not rename inside these directories or files
const ignored = ['node_modules', '.git', '.vscode', 'assets', 'server/node_modules', 'rebrand.js'];

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replacements
  // We want to replace "CONNECTA" with "Atlas" in text, but NOT break storage keys or JS variable names like CONNECTAStorage.
  // Using word boundaries to avoid replacing CONNECTAStorage or connectaStorageSchemaV1.
  
  // Standard UI replacements
  content = content.replace(/\bCONNECTA Free\b/g, 'Atlas Free');
  content = content.replace(/\bCONNECTA Recovery Passport\b/g, 'Atlas Recovery Passport');
  content = content.replace(/\bCONNECTA Recovery Safety Net\b/g, 'Atlas Recovery Safety Net');
  
  // General CONNECTA references (that are standalone words)
  // This will replace "CONNECTA" but won't match "CONNECTAStorage" because of \b
  content = content.replace(/\bCONNECTA\b/g, 'Atlas');
  content = content.replace(/\bConnecta\b/g, 'Atlas');
  
  fs.writeFileSync(filePath, content, 'utf8');
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (ignored.includes(file)) continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else {
      // Only process text files
      if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.md') || filePath.endsWith('.webmanifest') || filePath.endsWith('.json')) {
        replaceInFile(filePath);
      }
    }
  }
};

walkSync(directoryPath);
console.log('Rebrand script complete.');
