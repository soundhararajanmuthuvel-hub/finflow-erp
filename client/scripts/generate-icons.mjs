import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientRoot = path.resolve(__dirname, '..');
const chrome = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const svgFile = path.resolve(clientRoot, 'public/brand/finflow-mark.svg');
const out512 = path.resolve(clientRoot, 'public/brand/pwa-512x512.png');
const out192 = path.resolve(clientRoot, 'public/brand/pwa-192x192.png');
const outMaskable512 = path.resolve(clientRoot, 'public/brand/pwa-maskable-512x512.png');
const outMaskable192 = path.resolve(clientRoot, 'public/brand/pwa-maskable-192x192.png');
const outApple = path.resolve(clientRoot, 'public/brand/apple-touch-icon.png');

const tempHtml = path.resolve(clientRoot, 'public/brand/temp-icon.html');

try {
  // 1. Regular 512x512 and 192x192 (full-bleed mark)
  const htmlRegular = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  </style>
</head>
<body>
  <img src="${svgFile.replace(/\\/g, '/')}" />
</body>
</html>`;

  fs.writeFileSync(tempHtml, htmlRegular, 'utf8');

  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=512,512',
    `--screenshot=${out512}`,
    `file:///${tempHtml.replace(/\\/g, '/')}`
  ]);

  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=192,192',
    `--screenshot=${out192}`,
    `file:///${tempHtml.replace(/\\/g, '/')}`
  ]);

  // 2. Maskable (safe zone 80% with navy background)
  const htmlMaskable = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #072661;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      width: 80%;
      height: 80%;
      object-fit: contain;
      display: block;
    }
  </style>
</head>
<body>
  <img src="${svgFile.replace(/\\/g, '/')}" />
</body>
</html>`;

  fs.writeFileSync(tempHtml, htmlMaskable, 'utf8');

  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=512,512',
    `--screenshot=${outMaskable512}`,
    `file:///${tempHtml.replace(/\\/g, '/')}`
  ]);

  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=192,192',
    `--screenshot=${outMaskable192}`,
    `file:///${tempHtml.replace(/\\/g, '/')}`
  ]);

  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=180,180',
    `--screenshot=${outApple}`,
    `file:///${tempHtml.replace(/\\/g, '/')}`
  ]);

  console.log('✅ PWA Icons successfully generated:');
  console.log(' - pwa-512x512.png:', fs.statSync(out512).size, 'bytes');
  console.log(' - pwa-192x192.png:', fs.statSync(out192).size, 'bytes');
  console.log(' - pwa-maskable-512x512.png:', fs.statSync(outMaskable512).size, 'bytes');
  console.log(' - pwa-maskable-192x192.png:', fs.statSync(outMaskable192).size, 'bytes');
  console.log(' - apple-touch-icon.png:', fs.statSync(outApple).size, 'bytes');
} finally {
  if (fs.existsSync(tempHtml)) {
    fs.unlinkSync(tempHtml);
  }
}
