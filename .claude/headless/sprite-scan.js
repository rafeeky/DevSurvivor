const puppeteer = require('puppeteer')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  const btnPath  = 'file:///' + path.resolve('assets/ui/PNG/Buttons.png').replace(/\\/g,'/').replace(/^C:/i,'C:')
  const mmPath   = 'file:///' + path.resolve('assets/ui/PNG/Main_menu.png').replace(/\\/g,'/').replace(/^C:/i,'C:')

  await page.setContent(`
    <canvas id="b" width="400" height="528"></canvas>
    <canvas id="m" width="496" height="176"></canvas>
    <script>
    function loadImg(id, src) {
      return new Promise(res => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => { document.getElementById(id).getContext('2d').drawImage(img,0,0); res() }
        img.onerror = () => res()
        img.src = src
      })
    }
    Promise.all([loadImg('b','${btnPath}'), loadImg('m','${mmPath}')]).then(() => window._done = true)
    </script>`)

  await page.waitForFunction(() => window._done, { timeout: 8000 }).catch(() => {})

  // ── Buttons.png 행 스캔 ─────────────────────────────────────
  const btnGroups = await page.evaluate(() => {
    const ctx = document.getElementById('b').getContext('2d')
    const rows = []
    for (let y = 0; y < 528; y++) {
      const d = ctx.getImageData(0, y, 400, 1).data
      let x0 = -1, x1 = -1
      for (let x = 0; x < 400; x++) { if (d[x*4+3]>20) { if(x0<0)x0=x; x1=x } }
      if (x0 >= 0) {
        const mid = Math.floor((x0+x1)/2)
        const cd = ctx.getImageData(mid, y, 1, 1).data
        rows.push({ y, x0, x1, r:cd[0], g:cd[1], b:cd[2] })
      }
    }
    // group
    const groups = []
    let cur = null
    for (const r of rows) {
      if (!cur || r.y - cur.y2 > 3) { if(cur)groups.push(cur); cur={y1:r.y,y2:r.y,x0:r.x0,x1:r.x1,sample:r} }
      else { cur.y2=r.y; cur.x1=Math.max(cur.x1,r.x1); cur.sample=r }
    }
    if(cur)groups.push(cur)
    return groups
  })

  console.log('=== Buttons.png groups ===')
  btnGroups.forEach((g,i) => {
    const h = g.y2 - g.y1 + 1
    console.log(`[B${String(i).padStart(2,'0')}] y=${g.y1}-${g.y2} h=${h} x0=${g.x0} x1=${g.x1} rgb=${g.sample.r},${g.sample.g},${g.sample.b}`)
  })

  // ── Main_menu.png 행 스캔 ────────────────────────────────────
  const mmGroups = await page.evaluate(() => {
    const ctx = document.getElementById('m').getContext('2d')
    const rows = []
    for (let y = 0; y < 176; y++) {
      const d = ctx.getImageData(0, y, 496, 1).data
      let hasContent = false
      for (let x = 0; x < 496; x++) { if(d[x*4+3]>20){hasContent=true;break} }
      if (hasContent) {
        const cd = ctx.getImageData(48, y, 1, 1).data
        const cd2 = ctx.getImageData(148, y, 1, 1).data  // sample in button column
        rows.push({ y, r:cd[0],g:cd[1],b:cd[2], br:cd2[0],bg:cd2[1],bb:cd2[2] })
      }
    }
    const groups = []
    let cur = null
    for (const r of rows) {
      if (!cur || r.y - cur.y2 > 2) { if(cur)groups.push(cur); cur={y1:r.y,y2:r.y,sample:r} }
      else { cur.y2=r.y; cur.sample=r }
    }
    if(cur)groups.push(cur)
    return groups
  })

  console.log('\n=== Main_menu.png groups ===')
  mmGroups.forEach((g,i) => {
    const h = g.y2 - g.y1 + 1
    console.log(`[M${String(i).padStart(2,'0')}] y=${g.y1}-${g.y2} h=${h} panel_rgb=${g.sample.r},${g.sample.g},${g.sample.b} btn_rgb=${g.sample.br},${g.sample.bg},${g.sample.bb}`)
  })

  // ── Buttons.png 열 스캔 (x=0, 100, 200, 300에서 각 컬럼 색상) ──
  const btnCols = await page.evaluate(() => {
    const ctx = document.getElementById('b').getContext('2d')
    const colX = [50, 150, 250, 350]
    const results = []
    for (const x of colX) {
      const samples = []
      for (let y = 0; y < 528; y += 4) {
        const d = ctx.getImageData(x, y, 1, 1).data
        if (d[3] > 20) samples.push({y, r:d[0],g:d[1],b:d[2]})
      }
      results.push({x, samples: samples.slice(0,5)})
    }
    return results
  })
  console.log('\n=== Buttons.png 컬럼 상단 5개 샘플 ===')
  btnCols.forEach(c => {
    console.log(`x=${c.x}:`, c.samples.map(s=>`y${s.y}=(${s.r},${s.g},${s.b})`).join(' '))
  })

  await browser.close()
  process.exit(0)
})()
