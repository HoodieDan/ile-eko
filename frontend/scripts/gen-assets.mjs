#!/usr/bin/env node
/**
 * Generates the app icon / splash / adaptive-icon PNGs for both apps.
 *
 * The Ilé Èkó mark only ever existed as a React component (packages/ui Logo),
 * so there were no image assets at all — which broke the Android build
 * (expo-splash-screen references @drawable/splashscreen_logo, and with no image
 * the resource is never generated → "failed linking references").
 *
 * This rasterises the same mark — rounded square, doorway notch cut from the
 * bottom, brass dot top-right — with pure Node (zlib), so there's no image
 * dependency to install.
 *
 *   node scripts/gen-assets.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SS = 4; // supersampling factor for anti-aliasing

const THEMES = {
  landlord: { primary: '#1E6E52', primaryDeep: '#0F3D2E', accent: '#C79233', bg: '#F1EDE4' },
  tenant: { primary: '#2E3A8C', primaryDeep: '#171B45', accent: '#5563B5', bg: '#ECEEF6' },
};

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/** Minimal RGBA PNG encoder. */
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const crcTable = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  const crc = (buf) => {
    let c = -1;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const inRoundedRect = (x, y, rx, ry, rw, rh, r) => {
  if (x < rx || y < ry || x > rx + rw || y > ry + rh) return false;
  const cx = Math.min(Math.max(x, rx + r), rx + rw - r);
  const cy = Math.min(Math.max(y, ry + r), ry + rh - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

/**
 * Draw the mark. `mode`:
 *   'icon'   → mark fills a solid brand-coloured tile (app icon)
 *   'splash' → mark on transparent (splash logo, sits on backgroundColor)
 */
function render(size, theme, mode) {
  const W = size * SS;
  const out = Buffer.alloc(W * W * 4);
  const t = THEMES[theme];
  const markRGB = hex(t.primary);
  const notchRGB = mode === 'icon' ? hex(t.bg) : hex(t.bg);
  const dotRGB = hex(t.accent);
  const tileRGB = hex(t.primaryDeep);

  // Mark geometry: inset the mark inside the canvas.
  const inset = mode === 'icon' ? W * 0.18 : W * 0.08;
  const m = { x: inset, y: inset, s: W - inset * 2 };
  const radius = m.s * 0.29;
  const notchW = m.s * 0.42;
  const notchH = m.s * 0.58;
  const notchX = m.x + (m.s - notchW) / 2;
  const notchY = m.y + m.s - notchH;
  const dotR = (m.s * 0.18) / 2;
  const dotCX = m.x + m.s * 0.78;
  const dotCY = m.y + m.s * 0.22;

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let rgb = null;
      let a = 0;

      if (mode === 'icon') {
        rgb = tileRGB;
        a = 255;
      }
      if (inRoundedRect(px, py, m.x, m.y, m.s, m.s, radius)) {
        rgb = markRGB;
        a = 255;
      }
      // doorway notch cut from the bottom (rounded top corners)
      if (inRoundedRect(px, py, notchX, notchY, notchW, notchH + radius, notchW / 2)) {
        if (py >= notchY) {
          rgb = mode === 'icon' ? tileRGB : notchRGB;
          a = mode === 'icon' ? 255 : 255;
        }
      }
      // brass dot
      if ((px - dotCX) ** 2 + (py - dotCY) ** 2 <= dotR * dotR) {
        rgb = dotRGB;
        a = 255;
      }

      const i = (y * W + x) * 4;
      if (rgb) {
        out[i] = rgb[0];
        out[i + 1] = rgb[1];
        out[i + 2] = rgb[2];
        out[i + 3] = a;
      }
    }
  }

  // Downsample (box filter) for anti-aliasing.
  const fin = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const i = ((y * SS + dy) * W + (x * SS + dx)) * 4;
          const al = out[i + 3] / 255;
          r += out[i] * al;
          g += out[i + 1] * al;
          b += out[i + 2] * al;
          a += out[i + 3];
        }
      }
      const n = SS * SS;
      const aa = a / n;
      const i = (y * size + x) * 4;
      const alpha = aa / 255 || 1;
      fin[i] = Math.round(r / n / alpha);
      fin[i + 1] = Math.round(g / n / alpha);
      fin[i + 2] = Math.round(b / n / alpha);
      fin[i + 3] = Math.round(aa);
    }
  }
  return encodePng(size, size, fin);
}

for (const app of Object.keys(THEMES)) {
  const dir = join(ROOT, 'apps', app, 'assets');
  mkdirSync(dir, { recursive: true });
  const files = {
    'icon.png': render(1024, app, 'icon'),
    'adaptive-icon.png': render(1024, app, 'icon'),
    'splash-icon.png': render(512, app, 'splash'),
    'favicon.png': render(48, app, 'icon'),
  };
  for (const [name, buf] of Object.entries(files)) {
    writeFileSync(join(dir, name), buf);
    console.log(`${app.padEnd(9)} ${name.padEnd(18)} ${(buf.length / 1024).toFixed(1)} KB`);
  }
}
