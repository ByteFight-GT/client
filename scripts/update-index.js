import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Function to replace the path in index.html
async function updateIndexHtml() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const indexPath = path.join(__dirname, '../out', 'index.html');

  try {
    const data = await readFile(indexPath, 'utf8');
    const updatedData = data.replace(/\/_next\//g, './_next/');
    await writeFile(indexPath, updatedData, 'utf8');
  } catch (err) {
    console.error('Error updating index.html:', err);
  }
}

// Update index.html after the build process
updateIndexHtml();
