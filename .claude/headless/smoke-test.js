#!/usr/bin/env node
/**
 * .claude/headless/smoke-test.js
 * DevSurvivor 헤드리스 스모크 테스트
 * 사용: node .claude/headless/smoke-test.js
 */
const puppeteer = require('puppeteer')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page    = await browser.newPage()

  const jsErrors = []    // JS 실행 에러 (치명적)
  const imgErrors = []   // 이미지 404 (file:// 에서 예상됨 — 서버 배포 시 정상)
  page.on('console', msg => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (text.includes('ERR_FILE_NOT_FOUND') || text.includes('net::ERR_')) imgErrors.push(text)
    else jsErrors.push('[console.error] ' + text)
  })
  page.on('pageerror', err => jsErrors.push('[pageerror] ' + err.message))

  const filePath = 'file:///' + path.resolve('docs/index.html').replace(/\\/g, '/')
  await page.goto(filePath)

  // ── 1. GameState 초기화 확인 ────────────────────────────────
  let step1 = false
  try {
    await page.waitForFunction(() => window.GameState !== undefined, { timeout: 5000 })
    step1 = true
  } catch {}

  const checks = await page.evaluate(() => ({
    gameStateExists:  typeof window.GameState !== 'undefined',
    screenIsLobby:    window.GameState?.screen === 'lobby',
    charConfigsExist: typeof window.CHAR_CONFIGS !== 'undefined',
    enemySpriteExist: typeof window.ENEMY_SPRITE_CONFIGS !== 'undefined',
    tilemapExists:    typeof window.TilemapSystem !== 'undefined',
    selectedChar:     window.GameState?.selectedCharacter || '(none)',
  }))

  // ── 2. Game.start() 시뮬 ────────────────────────────────────
  let step2 = false
  try {
    await page.evaluate(() => window.Game?.start?.())
    await page.waitForFunction(() => window.GameState?.isRunning === true, { timeout: 3000 })
    step2 = true
  } catch {}

  // ── 3. 게임 루프 동작 (gameTime 증가) ─────────────────────────
  let step3 = false
  try {
    await page.waitForFunction(() => (window.GameState?.gameTime || 0) > 0.1, { timeout: 4000 })
    step3 = true
  } catch {}

  // ── 최종 상태 수집 ──────────────────────────────────────────
  const finalState = await page.evaluate(() => ({
    gameTime:    window.GameState?.gameTime,
    isRunning:   window.GameState?.isRunning,
    score:       window.GameState?.score,
    enemyCount:  window.GameState?.enemies?.length,
    screen:      window.GameState?.screen,
  }))

  await browser.close()

  // ── 출력 ────────────────────────────────────────────────────
  console.log('\n=== DevSurvivor Smoke Test ===')
  console.log('\n[Init Checks]')
  for (const [k, v] of Object.entries(checks)) {
    const ok = v !== false && v !== undefined
    console.log(`  ${ok ? '✅' : '❌'} ${k}: ${v}`)
  }

  console.log('\n[Sequence]')
  console.log(`  ${step1 ? '✅' : '❌'} GameState init`)
  console.log(`  ${step2 ? '✅' : '❌'} Game.start() → isRunning`)
  console.log(`  ${step3 ? '✅' : '❌'} game loop running (gameTime > 0.1)`)

  console.log('\n[Final State]')
  console.log(JSON.stringify(finalState, null, 2))

  if (jsErrors.length > 0) {
    console.log('\n[JS Errors (critical)]')
    jsErrors.forEach(e => console.error('  ❌', e))
  }
  if (imgErrors.length > 0) {
    console.log(`\n[Image 404s: ${imgErrors.length}건 — file:// 모드 예상값, 서버 배포 시 정상]`)
  }

  const allChecks = Object.values(checks).every(v => v !== false && v !== undefined)
  const passed = allChecks && step1 && step2 && step3 && jsErrors.length === 0
  console.log(passed ? '\n✅ PASS' : '\n❌ FAIL')
  process.exit(passed ? 0 : 1)
})()
