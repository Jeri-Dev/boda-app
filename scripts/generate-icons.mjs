// Dependency-free PWA icon generator. Renders an ivory heart on a dusty-rose
// field directly to PNG (Node zlib + a hand-rolled chunk writer) so we don't
// pull an image library just for placeholder marks. Re-run with:
//   node scripts/generate-icons.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

// Brand colors (approx of the OKLCH tokens): rose accent + ivory.
const BG = [168, 69, 92, 255]
const FG = [251, 247, 241, 255]

function png(size, { divisor, shiftY }) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(size * stride)
  for (let py = 0; py < size; py++) {
    raw[py * stride] = 0 // filter: none
    for (let px = 0; px < size; px++) {
      const u = ((px + 0.5) / size) * 2 - 1
      const v = ((py + 0.5) / size) * 2 - 1
      const X = u / divisor
      const Y = -(v - shiftY) / divisor
      // Implicit heart curve: (X²+Y²−1)³ − X²Y³ ≤ 0
      const inside = Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0
      const c = inside ? FG : BG
      const off = py * stride + 1 + px * 4
      raw[off] = c[0]
      raw[off + 1] = c[1]
      raw[off + 2] = c[2]
      raw[off + 3] = c[3]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outputs = [
  ['public/icon-192.png', 192, { divisor: 0.62, shiftY: 0.08 }],
  ['public/icon-512.png', 512, { divisor: 0.62, shiftY: 0.08 }],
  // Maskable: smaller heart so it survives the platform's safe-zone crop.
  ['public/icon-maskable-512.png', 512, { divisor: 0.92, shiftY: 0.06 }],
  ['public/apple-touch-icon.png', 180, { divisor: 0.62, shiftY: 0.08 }],
]

for (const [path, size, opts] of outputs) {
  writeFileSync(path, png(size, opts))
  console.log(`wrote ${path} (${size}x${size})`)
}
