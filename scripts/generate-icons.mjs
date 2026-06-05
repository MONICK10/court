// Pure Node.js PNG icon generator — no npm packages needed.
// Generates a simple court gavel icon in gold on dark navy.
// Run: node scripts/generate-icons.mjs

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const OUT_DIR = path.resolve('public/icons')
fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── Minimal PNG writer ─────────────────────────────────────────────

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) {
    crc ^= b
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const c = crc32(Buffer.concat([t, data]))
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(c)
  return Buffer.concat([len, t, data, crcBuf])
}

function writePNG(size, pixels) {
  // pixels: Uint8Array of RGBA values, row by row

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // colour type: RGB (we strip alpha for simplicity, but keep RGBA)
  ihdr[9] = 6   // colour type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // Raw image data with filter byte per row
  const raw = []
  for (let y = 0; y < size; y++) {
    raw.push(0) // filter type None
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      raw.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3])
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw))

  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ─── Draw icon ─────────────────────────────────────────────────────

function hex(h) {
  const n = parseInt(h.replace('#',''), 16)
  return [(n>>16)&255, (n>>8)&255, n&255, 255]
}

function drawIcon(size) {
  const px = new Uint8Array(size * size * 4)

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    // Alpha blend over existing
    const alpha = a / 255
    px[i]   = Math.round(px[i]   * (1 - alpha) + r * alpha)
    px[i+1] = Math.round(px[i+1] * (1 - alpha) + g * alpha)
    px[i+2] = Math.round(px[i+2] * (1 - alpha) + b * alpha)
    px[i+3] = 255
  }

  function fillRect(x, y, w, h, col, radius = 0) {
    const [r, g, b, a] = col
    for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
      for (let px2 = Math.floor(x); px2 < Math.ceil(x + w); px2++) {
        // Simple rounded rect
        if (radius > 0) {
          const dx = Math.max(0, Math.max(x + radius - px2, px2 - (x + w - radius)))
          const dy = Math.max(0, Math.max(y + radius - py, py - (y + h - radius)))
          if (Math.sqrt(dx*dx + dy*dy) > radius) continue
        }
        setPixel(px2, py, r, g, b, a)
      }
    }
  }

  function fillCircle(cx, cy, r, col) {
    const [cr, cg, cb, ca] = col
    for (let py = Math.floor(cy - r); py <= Math.ceil(cy + r); py++) {
      for (let px2 = Math.floor(cx - r); px2 <= Math.ceil(cx + r); px2++) {
        if ((px2 - cx) ** 2 + (py - cy) ** 2 <= r * r) {
          setPixel(px2, py, cr, cg, cb, ca)
        }
      }
    }
  }

  function drawLine(x1, y1, x2, y2, width, col) {
    const [r, g, b] = col
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.sqrt(dx*dx + dy*dy)
    const steps = Math.ceil(len * 2)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const cx = x1 + dx * t, cy = y1 + dy * t
      fillCircle(cx, cy, width / 2, [r, g, b, 255])
    }
  }

  const S = size / 192  // scale

  // Background — dark navy with rounded corners
  const BG = [10, 10, 15, 255]
  fillRect(0, 0, size, size, BG, size * 0.18)

  const GOLD = [192, 160, 96, 255]
  const GOLD_DIM = [192, 160, 96, 100]
  const WHITE = [255, 255, 255, 255]

  // Gavel head (horizontal block)
  fillRect(52*S, 58*S, 82*S, 46*S, GOLD, 8*S)

  // Gavel handle (diagonal line)
  drawLine(122*S, 104*S, 150*S, 132*S, 13*S, GOLD)

  // Sound block under gavel
  fillRect(70*S, 114*S, 48*S, 16*S, GOLD_DIM, 4*S)

  // Text "COURT" as simple pixel blocks (no font rendering)
  // Use simple 5×7 pixel font for each letter
  const letters = {
    C: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
    O: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    U: [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    R: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
    T: [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  }
  const word = ['C','O','U','R','T']
  const sc = Math.max(2, Math.round(3 * S))  // pixel size for each dot
  const totalW = word.length * (5 * sc + sc) - sc
  let lx = Math.round((size - totalW) / 2)
  const ly = Math.round(155 * S)

  for (const ch of word) {
    const grid = letters[ch]
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col]) {
          fillRect(lx + col * sc, ly + row * sc, sc, sc, WHITE)
        }
      }
    }
    lx += 5 * sc + sc
  }

  return px
}

// ─── Generate ──────────────────────────────────────────────────────

for (const size of [192, 512]) {
  const pixels = drawIcon(size)
  const png = writePNG(size, pixels)
  const file = path.join(OUT_DIR, `icon-${size}.png`)
  fs.writeFileSync(file, png)
  console.log(`✓ ${file} (${(png.length / 1024).toFixed(1)} KB)`)
}

console.log('Icons generated. Add to public/icons/')
