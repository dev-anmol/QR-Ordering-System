const { execSync } = require('child_process');
const fs = require('fs');

// Log the current directory and files
console.log('Current directory:', process.cwd());
console.log('Files:', fs.readdirSync('.').join(', '));

// Install Angular CLI globally for this build
console.log('Installing Angular CLI globally...');
execSync('npm install -g @angular/cli', { stdio: 'inherit' });

// Try building with more specific options
console.log('Building the Angular project with specific options...');
try {
  // execSync('ng build --configuration production --output-hashing=all --verbose=true', { stdio: 'inherit' });
  // Try this command instead
  execSync('ng build --configuration production --stats-json=false', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed with standard options. Trying alternative build...');
  // Try a more conservative build approach
  try {
    execSync('ng build --configuration=production --aot=false --build-optimizer=false', { stdio: 'inherit' });
  } catch (error2) {
    console.error('Second build attempt failed. Trying minimal build...');
    // Try a minimal build as last resort
    execSync('ng build --configuration=production --no-progress --stats-json=false', { stdio: 'inherit' });
  }
}
