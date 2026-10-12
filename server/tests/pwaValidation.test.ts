import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

console.log('====================================================');
console.log('FINFLOW — PWA INTEGRITY & OFFLINE SECURITY TEST SUITE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name: string, fn: () => void) {
  console.log(`${name}`);
  try {
    fn();
    passCount++;
  } catch (err: any) {
    failCount++;
    console.error(`  ERROR: ${err.message}\n`);
  }
}

const clientDir = path.resolve(__dirname, '../../client');
const publicDir = path.join(clientDir, 'public');
const distDir = path.join(clientDir, 'dist');

runTest('Test 1: Web App Manifest Standards & Schema Compliance', () => {
  const distManifestPath = path.join(distDir, 'manifest.webmanifest');
  assert(fs.existsSync(distManifestPath), 'Generated manifest.webmanifest exists in client/dist');

  const content = fs.readFileSync(distManifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  assert(manifest.name === 'FinFlow — Private Finance Management', 'Application name is FinFlow — Private Finance Management');
  assert(manifest.short_name === 'FinFlow', 'Application short_name is FinFlow');
  assert(manifest.display === 'standalone', 'Display mode is standalone');
  assert(manifest.theme_color === '#072661', 'Theme color is #072661 (FinFlow navy brand color)');
  assert(manifest.background_color === '#FAF7F2', 'Background color is #FAF7F2 (warm ivory canvas)');
  assert(manifest.start_url === '/', 'Start URL is root /');
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'Manifest defines at least 4 icons');

  const has192 = manifest.icons.some((i: any) => i.sizes === '192x192' && i.type === 'image/png');
  const has512 = manifest.icons.some((i: any) => i.sizes === '512x512' && i.type === 'image/png');
  const hasMaskable = manifest.icons.some((i: any) => i.purpose?.includes('maskable'));

  assert(has192, 'Manifest contains valid 192x192 PNG icon');
  assert(has512, 'Manifest contains valid 512x512 PNG icon');
  assert(hasMaskable, 'Manifest contains valid maskable icon for Android adaptive launchers');
});

runTest('Test 2: App Icon Asset Files Physical Existence', () => {
  const requiredIcons = [
    'brand/pwa-192x192.png',
    'brand/pwa-512x512.png',
    'brand/pwa-maskable-192x192.png',
    'brand/pwa-maskable-512x512.png',
    'brand/apple-touch-icon.png',
    'pwa-192x192.png',
    'pwa-512x512.png',
    'pwa-maskable-512x512.png',
  ];

  for (const relPath of requiredIcons) {
    const fullPath = path.join(publicDir, relPath);
    assert(fs.existsSync(fullPath), `Icon file exists: ${relPath}`);
    const stats = fs.statSync(fullPath);
    assert(stats.size > 100, `Icon file is non-empty (${stats.size} bytes): ${relPath}`);
  }
});

runTest('Test 3: Service Worker Financial Security Policy (Zero Private Data Caching)', () => {
  const distSwPath = path.join(distDir, 'sw.js');
  assert(fs.existsSync(distSwPath), 'Generated sw.js exists in client/dist');

  const swContent = fs.readFileSync(distSwPath, 'utf-8');

  // Verify that /api/ is routed as NetworkOnly and NEVER cached
  const hasNetworkOnlyApi = swContent.includes('NetworkOnly') && swContent.includes('/api/');
  assert(hasNetworkOnlyApi, 'Service worker strictly registers NetworkOnly strategy for /api/ routes');

  // Verify NavigationRoute denylist excludes /api/
  const hasNavigationDenylist = swContent.includes('denylist:[/^\\/api/]');
  assert(hasNavigationDenylist, 'Service worker NavigationRoute excludes /api/ requests from app shell');
});

runTest('Test 4: Offline Fallback Page & Offline Guard Specification', () => {
  const offlineHtmlPath = path.join(publicDir, 'offline.html');
  assert(fs.existsSync(offlineHtmlPath), 'Branded offline.html exists in public directory');

  const offlineHtml = fs.readFileSync(offlineHtmlPath, 'utf-8');
  assert(offlineHtml.includes('FinFlow'), 'Offline page contains FinFlow branding');
  assert(offlineHtml.includes('Offline'), 'Offline page indicates offline state clearly');
  assert(offlineHtml.includes('window.addEventListener(\'online\''), 'Offline page registers auto-reload upon reconnection');

  // Verify client-side API offline mutation guard in client.ts
  const clientApiFile = fs.readFileSync(path.join(clientDir, 'src/api/client.ts'), 'utf-8');
  const expectedOfflineMsg = 'You are offline. This financial transaction requires an active connection. Please reconnect and try again.';
  assert(clientApiFile.includes(expectedOfflineMsg), `Client API interceptor enforces exact offline protection message: "${expectedOfflineMsg}"`);
});

runTest('Test 5: iOS Safari Add-to-Home-Screen Guidance', () => {
  const pwaModalPath = path.join(clientDir, 'src/components/common/PWAInstallModal.tsx');
  assert(fs.existsSync(pwaModalPath), 'PWAInstallModal component exists');

  const pwaModalContent = fs.readFileSync(pwaModalPath, 'utf-8');
  assert(pwaModalContent.includes('Share'), 'iOS instructions clearly highlight the Safari Share button');
  assert(pwaModalContent.includes('Add to Home Screen'), 'iOS instructions explicitly guide user to "Add to Home Screen"');
});

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
