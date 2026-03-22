const puppeteer = require('puppeteer')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()

  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => {
    errors.push('[pageerror] ' + err.message + '\nSTACK: ' + (err.stack || '(no stack)'))
  })

  const filePath = 'file:///' + path.resolve('docs/index.html').replace(/\\/g, '/')
  await page.goto(filePath)
  await page.waitForFunction(() => window.GameState !== undefined, { timeout: 5000 }).catch(() => {})
  await page.evaluate(() => window.Game && window.Game.start && window.Game.start())
  await new Promise(r => setTimeout(r, 1200))

  // TilemapSystem 전역 확인
  const debug = await page.evaluate(() => {
    const tilemapKeys = Object.keys(window).filter(k =>
      k.toLowerCase().includes('tilemap') || k.toLowerCase().includes('map')
    )
    return {
      tilemapKeys,
      tilemapSystemType: typeof window.TilemapSystem,
      TilemapType: typeof window.Tilemap,
      gameStateKeys: window.GameState ? Object.keys(window.GameState) : [],
    }
  })

  console.log('=== Tilemap Debug ===')
  console.log(JSON.stringify(debug, null, 2))

  console.log('\n=== All Errors (' + errors.length + ') ===')
  errors.forEach(e => console.error(e))
  console.log('\nDone.')
  await browser.close()
})()
