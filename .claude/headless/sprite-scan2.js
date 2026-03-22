// PNG 직접 파싱 — 스프라이트 경계 측정
const fs   = require('fs')
const zlib = require('zlib')
const path = require('path')

function parsePNG(filePath) {
  const buf = fs.readFileSync(filePath)
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  const ctype = buf[25]  // 2=RGB, 6=RGBA, 3=indexed
  const channels = ctype === 6 ? 4 : ctype === 2 ? 3 : 4

  // IDAT 수집
  let idat = Buffer.alloc(0)
  let pos = 8
  while (pos < buf.length - 8) {
    const len  = buf.readUInt32BE(pos)
    const type = buf.slice(pos+4, pos+8).toString('ascii')
    if (type === 'IDAT') idat = Buffer.concat([idat, buf.slice(pos+8, pos+8+len)])
    if (type === 'IEND') break
    pos += 12 + len
  }
  const raw = zlib.inflateSync(idat)
  const stride = 1 + w * channels

  // defilter
  const px = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    const filt = raw[y * stride]
    const row  = Array.from(raw.slice(y * stride + 1, (y+1) * stride))
    const prev = y > 0 ? Array.from(raw.slice((y-1)*stride+1, y*stride)) : null
    for (let x = 0; x < w * channels; x++) {
      const a = x >= channels ? row[x - channels] : 0
      const b = prev ? prev[x] : 0
      const c = (x >= channels && prev) ? prev[x - channels] : 0
      if (filt === 0) {}
      else if (filt === 1) row[x] = (row[x] + a) & 0xff
      else if (filt === 2) row[x] = (row[x] + b) & 0xff
      else if (filt === 3) row[x] = (row[x] + ((a + b) >> 1)) & 0xff
      else if (filt === 4) {
        const pa = Math.abs(b-c), pb = Math.abs(a-c), pc = Math.abs(a+b-2*c)
        const pr = pa<=pb && pa<=pc ? a : pb<=pc ? b : c
        row[x] = (row[x] + pr) & 0xff
      }
    }
    for (let x = 0; x < w; x++) {
      px[(y*w+x)*4+0] = row[x*channels+0]
      px[(y*w+x)*4+1] = row[x*channels+1]
      px[(y*w+x)*4+2] = row[x*channels+2]
      px[(y*w+x)*4+3] = channels >= 4 ? row[x*channels+3] : 255
    }
  }
  return { w, h, px, getPixel(x,y){ const i=(y*w+x)*4; return [px[i],px[i+1],px[i+2],px[i+3]] } }
}

function scanRows(img, gapTolerance = 3) {
  const groups = []
  let cur = null
  for (let y = 0; y < img.h; y++) {
    let hasContent = false
    for (let x = 0; x < img.w; x++) {
      if (img.getPixel(x,y)[3] > 20) { hasContent = true; break }
    }
    if (hasContent) {
      if (!cur || y - cur.y2 > gapTolerance) {
        if (cur) groups.push(cur)
        cur = { y1: y, y2: y }
      } else {
        cur.y2 = y
      }
    }
  }
  if (cur) groups.push(cur)
  return groups
}

function scanCols(img, gapTolerance = 3) {
  const groups = []
  let cur = null
  for (let x = 0; x < img.w; x++) {
    let hasContent = false
    for (let y = 0; y < img.h; y++) {
      if (img.getPixel(x,y)[3] > 20) { hasContent = true; break }
    }
    if (hasContent) {
      if (!cur || x - cur.x2 > gapTolerance) {
        if (cur) groups.push(cur)
        cur = { x1: x, x2: x }
      } else {
        cur.x2 = x
      }
    }
  }
  if (cur) groups.push(cur)
  return groups
}

// ── Buttons.png ───────────────────────────────────────────────
console.log('\n=== Buttons.png (400×528) ===')
const btn = parsePNG(path.resolve('assets/ui/PNG/Buttons.png'))
const btnRows = scanRows(btn, 3)
btnRows.forEach((g, i) => {
  const mid = Math.round((g.y1 + g.y2) / 2)
  const sample = btn.getPixel(50, mid)
  const sample2 = btn.getPixel(150, mid)
  console.log(`[R${String(i).padStart(2,'0')}] y=${g.y1}-${g.y2} h=${g.y2-g.y1+1}  col0=(${sample[0]},${sample[1]},${sample[2]},${sample[3]})  col1=(${sample2[0]},${sample2[1]},${sample2[2]},${sample2[3]})`)
})

// 열 그룹도
const btnCols = scanCols(btn, 3)
console.log('Cols:', btnCols.map(c => `x=${c.x1}-${c.x2}(w=${c.x2-c.x1+1})`).join('  '))

// ── Main_menu.png ─────────────────────────────────────────────
console.log('\n=== Main_menu.png (496×176) ===')
const mm = parsePNG(path.resolve('assets/ui/PNG/Main_menu.png'))
const mmRows = scanRows(mm, 3)
mmRows.forEach((g, i) => {
  const mid = Math.round((g.y1 + g.y2) / 2)
  const s0 = mm.getPixel(48, mid)
  const s1 = mm.getPixel(148, mid)
  const s2 = mm.getPixel(248, mid)
  console.log(`[R${String(i).padStart(2,'0')}] y=${g.y1}-${g.y2} h=${g.y2-g.y1+1}  c0=(${s0[0]},${s0[1]},${s0[2]})  c1=(${s1[0]},${s1[1]},${s1[2]})  c2=(${s2[0]},${s2[1]},${s2[2]})`)
})
const mmCols = scanCols(mm, 3)
console.log('Cols:', mmCols.map(c => `x=${c.x1}-${c.x2}(w=${c.x2-c.x1+1})`).join('  '))

// Win_loose.png 하단 별 클러스터 위치 검증
console.log('\n=== Win_loose.png (448×416) — 하단 별 클러스터 검증 ===')
const wl = parsePNG(path.resolve('assets/ui/PNG/Win_loose.png'))
const wlRows = scanRows(wl, 4)
wlRows.forEach((g, i) => {
  if (g.y1 < 350) return  // 상단은 스킵
  const mid = Math.round((g.y1 + g.y2) / 2)
  const s = [40,120,200,280,360,420].map(x => wl.getPixel(Math.min(x,447), mid))
  console.log(`[R${String(i).padStart(2,'0')}] y=${g.y1}-${g.y2} h=${g.y2-g.y1+1}  samples=${s.map(p=>`(${p[0]},${p[1]},${p[2]})`).join(' ')}`)
})
