/**
 * Helix HUD — Automated Screenshot Generator
 *
 * Serves the built NUI via a local HTTP server, renders it in headless Chrome
 * against a GTA V-style city background, injects mock data via window.postMessage,
 * and captures high-quality PNGs.
 *
 * Usage: node scripts/screenshots.mjs
 */
import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_DIR = path.resolve(__dirname, '../../html');
const DOCS_DIR = path.resolve(__dirname, '../../docs');
const OUTPUT_DIR = path.resolve(DOCS_DIR, 'screenshots');
const BG_IMAGE_PATH = path.resolve(OUTPUT_DIR, 'bg-city-night.png');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Background generation — creates a GTA V-style night city scene
// ---------------------------------------------------------------------------

async function ensureBackground(browser) {
  if (fs.existsSync(BG_IMAGE_PATH)) return;
  console.log('Generating city background...');
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setContent(`<html><body style="margin:0;padding:0;overflow:hidden;">
<canvas id="c" width="1920" height="1080"></canvas>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d'),W=1920,H=1080;
const sky=ctx.createLinearGradient(0,0,0,H);
sky.addColorStop(0,'#0a0a1a');sky.addColorStop(0.3,'#0f1024');
sky.addColorStop(0.55,'#141830');sky.addColorStop(0.7,'#1a1e3a');sky.addColorStop(1,'#1e2240');
ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
for(let i=0;i<120;i++){const x=Math.random()*W,y=Math.random()*H*0.4,r=Math.random()*1.2+0.3;
ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+(Math.random()*0.5+0.2)+')';ctx.fill();}
let bx=-20;const buildings=[];
while(bx<W+100){const bw=30+Math.random()*80,bh=80+Math.random()*350,by=H*0.52-bh;
buildings.push({x:bx,y:by,w:bw,h:bh});bx+=bw+Math.random()*15;}
buildings.forEach(b=>{const s=10+Math.floor(Math.random()*20);
ctx.fillStyle='rgb('+s+','+s+','+(s+5)+')';ctx.fillRect(b.x,b.y,b.w,b.h+H*0.5);
for(let wy=b.y+8;wy<b.y+b.h-10;wy+=12){for(let wx=b.x+5;wx<b.x+b.w-5;wx+=11){
if(Math.random()>0.55){const warm=Math.random()>0.3;
ctx.fillStyle=warm?'rgba('+(200+Math.floor(Math.random()*55))+','+(170+Math.floor(Math.random()*60))+','+(80+Math.floor(Math.random()*40))+','+(0.5+Math.random()*0.5)+')':'rgba(100,180,255,'+(0.3+Math.random()*0.4)+')';
ctx.fillRect(wx,wy,3,4);}}}});
const gnd=ctx.createLinearGradient(0,H*0.52,0,H);gnd.addColorStop(0,'#15161e');gnd.addColorStop(0.1,'#0d0e14');gnd.addColorStop(1,'#08090e');
ctx.fillStyle=gnd;ctx.fillRect(0,H*0.52,W,H*0.48);
ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(0,H*0.72,W,2);
for(let dx=0;dx<W;dx+=60){ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(dx,H*0.78,30,2);}
[200,550,900,1250,1600].forEach(lx=>{ctx.fillStyle='rgba(40,40,50,0.8)';ctx.fillRect(lx,H*0.45,3,H*0.27);
const g=ctx.createRadialGradient(lx,H*0.45,0,lx,H*0.45,120);g.addColorStop(0,'rgba(255,200,100,0.15)');
g.addColorStop(0.4,'rgba(255,180,80,0.06)');g.addColorStop(1,'rgba(255,180,80,0)');ctx.fillStyle=g;ctx.fillRect(lx-120,H*0.33,240,280);});
const nc=['rgba(255,0,100,0.3)','rgba(0,200,255,0.3)','rgba(100,255,0,0.25)','rgba(255,100,0,0.25)'];
buildings.filter(b=>b.w>50&&b.h>200&&Math.random()>0.5).slice(0,5).forEach(b=>{
const col=nc[Math.floor(Math.random()*nc.length)],ny=b.y+b.h*0.3+Math.random()*b.h*0.2,nw=b.w*0.6,nx=b.x+(b.w-nw)/2;
ctx.fillStyle=col;ctx.fillRect(nx,ny,nw,3);});
const hz=ctx.createLinearGradient(0,H*0.4,0,H*0.6);hz.addColorStop(0,'rgba(20,25,50,0)');
hz.addColorStop(0.5,'rgba(20,25,50,0.3)');hz.addColorStop(1,'rgba(20,25,50,0)');
ctx.fillStyle=hz;ctx.fillRect(0,H*0.4,W,H*0.2);
const vig=ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.7);
vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,0.4)');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
</script></body></html>`);
  await sleep(500);
  const canvas = await page.$('#c');
  await canvas.screenshot({ path: BG_IMAGE_PATH, type: 'png' });
  await page.close();
  console.log('  Background generated.\n');
}

// ---------------------------------------------------------------------------
// MIME types for the static server
// ---------------------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

// ---------------------------------------------------------------------------
// Simple static file server that serves from multiple directories
// ---------------------------------------------------------------------------
function createServer() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);

    // Serve background image from screenshots dir
    if (urlPath === '/bg-city-night.png') {
      if (fs.existsSync(BG_IMAGE_PATH)) {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        fs.createReadStream(BG_IMAGE_PATH).pipe(res);
        return;
      }
    }

    // Serve built HTML files
    let filePath = path.join(HTML_DIR, urlPath === '/' ? 'index.html' : urlPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

const BASE_CONFIG = {
  elements: {
    health: true,
    armor: true,
    hunger: true,
    thirst: true,
    stress: false,
    stamina: true,
    cash: true,
    bank: true,
    job: true,
    serverId: true,
  },
  vehicle: {
    enabled: true,
    speedUnit: 'kmh',
    fuelScript: 'auto',
    seatbelt: true,
  },
  theme: 'dark',
  position: 'bottom-right',
  scale: 2.2,
};

const SCENARIOS = [
  {
    name: 'preview-dark-onfoot',
    description: 'Dark theme — on foot, healthy',
    status: { health: 85, armor: 60, hunger: 70, thirst: 55, stamina: 82, stress: 0 },
    vehicle: { active: false, speed: 0, fuel: 0, engine: false, seatbelt: false, speedUnit: 'kmh' },
    playerInfo: { cash: 12450, bank: 84200, job: 'LSPD Officer', serverId: 42 },
    config: { ...BASE_CONFIG, theme: 'dark' },
  },
  {
    name: 'preview-dark-vehicle',
    description: 'Dark theme — in vehicle',
    status: { health: 85, armor: 60, hunger: 70, thirst: 55, stamina: 78, stress: 0 },
    vehicle: { active: true, speed: 67, fuel: 72, engine: true, seatbelt: true, speedUnit: 'mph' },
    playerInfo: { cash: 12450, bank: 84200, job: 'LSPD Officer', serverId: 42 },
    config: { ...BASE_CONFIG, theme: 'dark' },
  },
  {
    name: 'preview-dark-combat',
    description: 'Dark theme — low health combat',
    status: { health: 23, armor: 0, hunger: 45, thirst: 30, stress: 78, stamina: 35 },
    vehicle: { active: false, speed: 0, fuel: 0, engine: false, seatbelt: false, speedUnit: 'kmh' },
    playerInfo: { cash: 2100, bank: 15800, job: 'Gang Member', serverId: 88 },
    config: {
      ...BASE_CONFIG,
      theme: 'dark',
      elements: { ...BASE_CONFIG.elements, stress: true },
    },
  },
  {
    name: 'preview-light-onfoot',
    description: 'Light theme — on foot, healthy',
    status: { health: 85, armor: 60, hunger: 70, thirst: 55, stamina: 82, stress: 0 },
    vehicle: { active: false, speed: 0, fuel: 0, engine: false, seatbelt: false, speedUnit: 'kmh' },
    playerInfo: { cash: 12450, bank: 84200, job: 'LSPD Officer', serverId: 42 },
    config: { ...BASE_CONFIG, theme: 'light' },
  },
  {
    name: 'preview-dark-vehicle-lowfuel',
    description: 'Dark theme — vehicle, low fuel warning',
    status: { health: 75, armor: 40, hunger: 60, thirst: 50, stamina: 90, stress: 0 },
    vehicle: { active: true, speed: 45, fuel: 8, engine: true, seatbelt: false, speedUnit: 'kmh' },
    playerInfo: { cash: 5300, bank: 22100, job: 'Taxi Driver', serverId: 15 },
    config: { ...BASE_CONFIG, theme: 'dark' },
  },
  {
    name: 'preview-overview',
    description: 'Marketing hero — full HUD with vehicle',
    status: { health: 92, armor: 75, hunger: 80, thirst: 65, stamina: 88, stress: 0 },
    vehicle: { active: true, speed: 82, fuel: 64, engine: true, seatbelt: true, speedUnit: 'mph' },
    playerInfo: { cash: 24800, bank: 156000, job: 'CEO | Helix Corp', serverId: 1 },
    config: { ...BASE_CONFIG, theme: 'dark' },
  },
];

// ---------------------------------------------------------------------------
// Screenshot capture
// ---------------------------------------------------------------------------

async function captureScreenshot(page, scenario) {
  const { name, status, vehicle, playerInfo, config } = scenario;

  // Set visibility first
  await page.evaluate(() => {
    window.postMessage({ action: 'setVisible', visible: true }, '*');
  });
  await sleep(150);

  // Push HUD data
  await page.evaluate(
    (data) => {
      window.postMessage(
        {
          action: 'updateHud',
          status: data.status,
          vehicle: data.vehicle,
          playerInfo: data.playerInfo,
          config: data.config,
        },
        '*',
      );
    },
    { status, vehicle, playerInfo, config },
  );

  // Wait for React render + CSS animations to settle
  await sleep(1000);

  const outputPath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`  ✓ ${name}.png — ${scenario.description}`);
  return outputPath;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Helix HUD — Screenshot Generator\n');

  // Verify build exists
  const indexPath = path.join(HTML_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: Built NUI not found at', indexPath);
    console.error('Run "npm run build" in the nui directory first.');
    process.exit(1);
  }

  // Start static file server
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Static server on ${baseUrl}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  // Generate background image if it doesn't exist
  await ensureBackground(browser);

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Mock GetParentResourceName so the NUI doesn't error
  await page.evaluateOnNewDocument(() => {
    window.GetParentResourceName = () => 'helix_hud';
    // Swallow fetch calls to the FiveM resource
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      if (typeof args[0] === 'string' && args[0].startsWith('https://helix_hud/')) {
        return Promise.resolve(new Response('{}', { status: 200 }));
      }
      return origFetch.apply(this, args);
    };
  });

  // Load the NUI
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });

  // Inject background image and body styles
  const bgUrl = fs.existsSync(BG_IMAGE_PATH)
    ? `${baseUrl}/bg-city-night.png`
    : null;

  await page.evaluate((bgUrl) => {
    document.body.style.cssText = `
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 1920px;
      height: 1080px;
      background: ${bgUrl ? `url("${bgUrl}") center/cover no-repeat` : '#0a0a1a'};
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    const root = document.getElementById('root');
    if (root) {
      root.style.width = '1920px';
      root.style.height = '1080px';
      root.style.position = 'relative';
    }
  }, bgUrl);

  // Wait for background image to load
  await sleep(800);

  // Verify the app rendered
  const appRendered = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root && root.innerHTML.length > 0;
  });
  if (!appRendered) {
    console.error('ERROR: React app did not render. Check the NUI build.');
    await browser.close();
    server.close();
    process.exit(1);
  }

  console.log('Capturing screenshots...\n');

  for (const scenario of SCENARIOS) {
    // Reset visibility between shots
    await page.evaluate(() => {
      window.postMessage({ action: 'setVisible', visible: false }, '*');
    });
    await sleep(250);

    await captureScreenshot(page, scenario);
  }

  await browser.close();
  server.close();

  // Copy hero image to repo root
  const heroSrc = path.join(OUTPUT_DIR, 'preview-overview.png');
  const heroDst = path.resolve(__dirname, '../../preview.png');
  if (fs.existsSync(heroSrc)) {
    fs.copyFileSync(heroSrc, heroDst);
    console.log('\n  ✓ preview.png copied to repo root');
  }

  // Print file sizes
  console.log('\nFile sizes:');
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.startsWith('preview-'));
  for (const file of files) {
    const stat = fs.statSync(path.join(OUTPUT_DIR, file));
    console.log(`  ${file}: ${(stat.size / 1024).toFixed(0)} KB`);
  }

  console.log('\nDone! Screenshots saved to docs/screenshots/');
}

main().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
