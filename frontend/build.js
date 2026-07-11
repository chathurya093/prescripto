import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  console.log('Building main frontend...');
  execSync('npm run build-only', { stdio: 'inherit', cwd: __dirname });

  console.log('Installing admin dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'admin') });

  console.log('Building admin panel...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, 'admin') });

  console.log('Copying admin build to frontend dist/admin...');
  const adminSource = path.join(__dirname, 'admin', 'dist');
  const adminDest = path.join(__dirname, 'dist', 'admin');

  if (fs.existsSync(adminDest)) {
    fs.rmSync(adminDest, { recursive: true, force: true });
  }

  // Use fs.cpSync (standard in newer Node.js versions) to copy the folder recursively
  fs.cpSync(adminSource, adminDest, { recursive: true });
  console.log('Admin build copied to dist/admin successfully.');
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
