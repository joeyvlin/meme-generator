import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '../src/assets');
const templates = [
  { name: 'drake-pointing', url: 'https://i.imgflip.com/30b1gx.jpg' },
  { name: 'distracted-boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
  { name: 'expanding-brain', url: 'https://i.imgflip.com/1bgw.jpg' },
  { name: 'this-is-fine', url: 'https://i.imgflip.com/26am.jpg' },
  { name: 'change-my-mind', url: 'https://i.imgflip.com/24y43o.jpg' },
  { name: 'woman-yelling-cat', url: 'https://i.imgflip.com/345v97.jpg' },
];

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadAllTemplates() {
  console.log('Downloading template images...');
  
  for (const template of templates) {
    const extension = template.url.split('.').pop().split('?')[0] || 'jpg';
    const filename = `${template.name}.${extension}`;
    const filepath = path.join(assetsDir, filename);
    
    try {
      console.log(`Downloading ${template.name}...`);
      await downloadImage(template.url, filepath);
      console.log(`✓ Downloaded ${filename}`);
    } catch (error) {
      console.error(`✗ Failed to download ${template.name}:`, error.message);
    }
  }
  
  console.log('Done!');
}

downloadAllTemplates();

