// Patch script to fix simple-peer getUserMedia issue
const fs = require('fs');
const path = require('path');

const simplePeerPath = path.join(__dirname, 'node_modules', 'simple-peer', 'index.js');

if (fs.existsSync(simplePeerPath)) {
  let content = fs.readFileSync(simplePeerPath, 'utf8');
  
  // Find and replace the problematic getUserMedia call
  // Replace: getUserMedia.call(navigator.mediaDevices, constraints)
  // With: (navigator.mediaDevices.getUserMedia || function() { return Promise.reject(new Error('getUserMedia not available')); }).call(navigator.mediaDevices, constraints)
  
  const originalPattern = /getUserMedia\.call\(navigator\.mediaDevices/g;
  const replacement = '(navigator.mediaDevices.getUserMedia || function() { return Promise.reject(new Error("getUserMedia not available")); }).call(navigator.mediaDevices';
  
  if (content.match(originalPattern)) {
    content = content.replace(originalPattern, replacement);
    fs.writeFileSync(simplePeerPath, content, 'utf8');
    console.log('✓ Patched simple-peer successfully');
  } else {
    console.log('⚠ Pattern not found in simple-peer, might already be patched or version changed');
  }
} else {
  console.log('✗ simple-peer not found at:', simplePeerPath);
}
