// Run this script to convert logo files from .jpg to .png or create placeholder files
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname);

// Create placeholder icons if they don't exist
function createPlaceholderIcon(filename) {
  const filepath = path.join(publicDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`Creating placeholder icon: ${filename}`);
    // Create a tiny 1x1 transparent PNG
    const transparentPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(filepath, transparentPNG);
  }
}

// Update manifest to match available files
function updateManifest() {
  const manifestPath = path.join(publicDir, 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check for each icon and create if needed
    manifest.icons.forEach(icon => {
      if (icon.src !== 'favicon.ico') {
        createPlaceholderIcon(icon.src);
      }
    });
    
    console.log('Manifest icons updated');
  } else {
    console.log('Manifest file not found');
  }
}

// Create favicon.ico if it doesn't exist
createPlaceholderIcon('favicon.ico');
updateManifest();

console.log('Done! All manifest icon files have been created or updated.'); 