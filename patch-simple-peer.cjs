// Patch script to fix simple-peer getUserMedia issue
const fs = require('fs');
const path = require('path');

console.log('🔧 Attempting to patch simple-peer...');

const simplePeerPath = path.join(__dirname, 'node_modules', 'simple-peer', 'index.js');

if (!fs.existsSync(simplePeerPath)) {
  console.log('⚠ simple-peer not found at:', simplePeerPath);
  console.log('Checking for simplepeer.min.js...');
  
  const minPath = path.join(__dirname, 'node_modules', 'simple-peer', 'simplepeer.min.js');
  if (fs.existsSync(minPath)) {
    console.log('Found minified version, but cannot patch minified code');
    console.log('✓ Skipping patch - will rely on runtime polyfills');
  }
  process.exit(0);
}

let content = fs.readFileSync(simplePeerPath, 'utf8');
let patched = false;

// Try multiple patterns that might exist in different versions
const patterns = [
  {
    name: 'getUserMedia.call pattern',
    find: /getUserMedia\.call\(navigator\.mediaDevices/g,
    replace: '(navigator.mediaDevices.getUserMedia || function() { return Promise.reject(new Error("getUserMedia not available")); }).call(navigator.mediaDevices'
  },
  {
    name: 'navigator.mediaDevices.getUserMedia direct call',
    find: /navigator\.mediaDevices\.getUserMedia\(/g,
    replace: '(navigator.mediaDevices && navigator.mediaDevices.getUserMedia || function() { return Promise.reject(new Error("getUserMedia not available")); })('
  },
  {
    name: 'getUserMedia variable assignment',
    find: /var getUserMedia = navigator\.mediaDevices\.getUserMedia/g,
    replace: 'var getUserMedia = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || function() { return Promise.reject(new Error("getUserMedia not available")); }'
  }
];

for (const pattern of patterns) {
  if (content.match(pattern.find)) {
    console.log(`✓ Found pattern: ${pattern.name}`);
    content = content.replace(pattern.find, pattern.replace);
    patched = true;
  }
}

if (patched) {
  fs.writeFileSync(simplePeerPath, content, 'utf8');
  console.log('✅ Patched simple-peer successfully!');
} else {
  console.log('⚠ No patterns matched - simple-peer might not need patching');
  console.log('✓ Will rely on runtime polyfills in index.html and vite.config.js');
}

process.exit(0);

