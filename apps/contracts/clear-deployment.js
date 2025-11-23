// Script to clear corrupted deployment state
const fs = require('fs');
const path = require('path');

const deploymentsDir = path.join(__dirname, 'ignition', 'deployments');

if (fs.existsSync(deploymentsDir)) {
  console.log('Clearing deployment state...');
  
  // List all chain directories
  const chainDirs = fs.readdirSync(deploymentsDir).filter(dir => {
    const fullPath = path.join(deploymentsDir, dir);
    return fs.statSync(fullPath).isDirectory();
  });
  
  chainDirs.forEach(chainDir => {
    const chainPath = path.join(deploymentsDir, chainDir);
    console.log(`Removing deployment state for chain: ${chainDir}`);
    fs.rmSync(chainPath, { recursive: true, force: true });
  });
  
  console.log('Deployment state cleared!');
} else {
  console.log('No deployment state found.');
}

