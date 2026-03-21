// bundle.js — Dev Survivor 단일 파일 번들 생성기
const fs = require('fs')
const path = require('path')

const BASE = __dirname

// 로드 순서 (game.js는 별도 처리)
const SCRIPTS = [
  'entities/charsprites.js',
  'entities/enemysprites.js',
  'entities/player.js',
  'entities/enemies.js',
  'entities/skills.js',
  'systems/tilemap.js',
  'systems/spawner.js',
  'systems/levelup.js',
  'systems/score.js',
  'systems/meta.js',
  'ui/hud.js',
  'ui/lobby.js',
  'ui/result.js',
  'ui/joystick.js',
]

function readFile(rel) {
  return fs.readFileSync(path.join(BASE, rel), 'utf8')
}

// game.js에서 dynamic import 제거 → 동기 초기화로 변환
function processGameJs(src) {
  // tryImport 함수 제거
  src = src.replace(/async function tryImport[\s\S]*?\n\}\n/, '')
  // async IIFE 전체 제거 후 동기 초기화로 대체
  src = src.replace(/;\(async \(\) => \{[\s\S]*?\}\)\(\)/, `
// 모든 모듈 이미 로드됨 — 동기 초기화
window.dispatchEvent(new Event('gameReady'))
Game.init()
`)
  return src
}

const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: 'Courier New', Courier, monospace;
    }
    #gameCanvas {
      display: block;
      border: 2px solid #2a2a5e;
      box-shadow: 0 0 40px rgba(68, 136, 255, 0.3);
    }
`

let scriptBlocks = ''
for (const rel of SCRIPTS) {
  const code = readFile(rel)
  scriptBlocks += `\n  <!-- ${rel} -->\n  <script>\n${code}\n  </script>\n`
}

const gameJs = processGameJs(readFile('game.js'))
scriptBlocks += `\n  <!-- game.js -->\n  <script>\n${gameJs}\n  </script>\n`

let html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dev Survivor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <canvas id="gameCanvas" width="800" height="600"></canvas>
${scriptBlocks}
</body>
</html>
`

// ── 픽셀 폰트 변환: monospace → "Press Start 2P" ──────────────────────────
// 한글은 fallback monospace 사용, 숫자/영문은 픽셀 폰트 적용
html = html.replace(/(\d+)px monospace/g, (match, sizeStr) => {
  const size = parseInt(sizeStr)
  let newSize
  if (size >= 200) newSize = 48
  else if (size >= 80) newSize = 32
  else if (size >= 50) newSize = 24
  else if (size >= 36) newSize = 16
  else if (size >= 18) newSize = 12
  else if (size >= 13) newSize = 10
  else newSize = 8
  return `${newSize}px "Press Start 2P", monospace`
})

const outPath = path.join(BASE, 'docs', 'index.html')
fs.mkdirSync(path.join(BASE, 'docs'), { recursive: true })
fs.writeFileSync(outPath, html, 'utf8')

// ── RGB PNG 흰색 배경 제거 → RGBA PNG 변환 (빌드타임) ──────────────────────
const zlib = require('zlib')

function _pngDefilter(raw, w, bpp) {
  const stride = w * bpp
  const h = Math.floor(raw.length / (stride + 1))
  const out = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const filt = raw[y * (stride + 1)]
    const src  = y * (stride + 1) + 1
    const dst  = y * stride
    for (let x = 0; x < stride; x++) {
      const rx = raw[src + x]
      const a  = x >= bpp ? out[dst + x - bpp] : 0
      const b  = y > 0    ? out[(y-1) * stride + x] : 0
      const c  = (y > 0 && x >= bpp) ? out[(y-1) * stride + x - bpp] : 0
      let val
      switch (filt) {
        case 0: val = rx; break
        case 1: val = (rx + a) & 0xFF; break
        case 2: val = (rx + b) & 0xFF; break
        case 3: val = (rx + ((a + b) >> 1)) & 0xFF; break
        case 4: {
          const p = a + b - c
          const pr = (Math.abs(p-a) <= Math.abs(p-b) && Math.abs(p-a) <= Math.abs(p-c)) ? a
                   : (Math.abs(p-b) <= Math.abs(p-c)) ? b : c
          val = (rx + pr) & 0xFF
        } break
        default: val = rx
      }
      out[dst + x] = val
    }
  }
  return { pixels: out, w, h }
}

function _buildCRC() {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return (buf) => {
    let c = 0xFFFFFFFF
    for (const b of buf) c = t[(c ^ b) & 0xFF] ^ (c >>> 8)
    return (c ^ 0xFFFFFFFF) >>> 0
  }
}
const _crc32 = _buildCRC()

function _pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td  = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(_crc32(td))
  return Buffer.concat([len, td, crc])
}

function convertRGBtoRGBA(inputPath, outputPath, tolerance = 30) {
  const buf  = fs.readFileSync(inputPath)
  const w    = buf.readUInt32BE(16), h = buf.readUInt32BE(20)
  const bpp  = buf[25] === 6 ? 4 : 3
  let idats  = [], off = 8
  while (off < buf.length - 12) {
    const len  = buf.readUInt32BE(off)
    const type = buf.slice(off+4, off+8).toString()
    if (type === 'IDAT') idats.push(buf.slice(off+8, off+8+len))
    if (type === 'IEND') break
    off += 12 + len
  }
  const raw   = zlib.inflateSync(Buffer.concat(idats))
  const { pixels } = _pngDefilter(raw, w, bpp)

  // RGB → RGBA (흰색 제거)
  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const si = i * bpp
    const r = pixels[si], g = pixels[si+1], b = pixels[si+2]
    const a = (r >= 255-tolerance && g >= 255-tolerance && b >= 255-tolerance) ? 0 : 255
    rgba[i*4] = r; rgba[i*4+1] = g; rgba[i*4+2] = b; rgba[i*4+3] = a
  }

  // RGBA PNG 인코딩 (filter=0 None)
  const rowStride = w * 4
  const rawOut = Buffer.alloc(h * (rowStride + 1))
  for (let y = 0; y < h; y++) {
    rawOut[y * (rowStride + 1)] = 0
    rgba.copy(rawOut, y * (rowStride + 1) + 1, y * rowStride, (y+1) * rowStride)
  }
  const comp = zlib.deflateSync(rawOut, { level: 6 })
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6  // RGBA

  const out = Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    _pngChunk('IHDR', ihdr),
    _pngChunk('IDAT', comp),
    _pngChunk('IEND', Buffer.alloc(0)),
  ])
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, out)
}

// Tommy 스프라이트 변환 (sprite-pack-3 RGB → assets/custom/player/ RGBA)
const SP3 = path.join(BASE, 'assets/packs/sprite-pack-3')
const DST = path.join(BASE, 'assets/custom/player')
const TOMMY_SPRITES = [
  { src: `${SP3}/4 - Tommy/Idle_Poses (32 x 32).png`, dst: `${DST}/tommy_idle.png` },
  { src: `${SP3}/4 - Tommy/Running (32 x 32).png`,    dst: `${DST}/tommy_walk.png` },
  { src: `${SP3}/4 - Tommy/Kick (32 x 32).png`,       dst: `${DST}/tommy_action.png` },
  { src: `${SP3}/4 - Tommy/Hurt (32 x 32).png`,       dst: `${DST}/tommy_hit.png` },
]
let convCount = 0
for (const { src, dst } of TOMMY_SPRITES) {
  try { convertRGBtoRGBA(src, dst); convCount++ } catch (e) { console.warn('⚠️ 변환 실패:', src, e.message) }
}
console.log(`✅ Tommy 스프라이트 변환 완료 (${convCount}/${TOMMY_SPRITES.length})`)

// assets/ → docs/assets/ 동기화
// (한글 경로 환경에서 fs.cpSync segfault 방지 → PowerShell 사용)
const { execSync } = require('child_process')
try {
  const src = path.join(BASE, 'assets')
  const dst = path.join(BASE, 'docs', 'assets')
  execSync(
    `powershell -Command "Copy-Item -Path '${src}\\*' -Destination '${dst}' -Recurse -Force"`,
    { stdio: 'pipe' }
  )
  console.log('✅ assets/ → docs/assets/ 복사 완료')
} catch (e) {
  console.warn('⚠️ assets 복사 실패 (수동으로 docs/assets/ 복사 필요):', e.message)
}

const size = (fs.statSync(outPath).size / 1024).toFixed(1)
console.log(`✅ 번들 완료: docs/index.html (${size} KB)`)
