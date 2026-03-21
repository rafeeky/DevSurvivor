# headless-sim-validator — 헤드리스 게임 테스트 스킬
> **유형**: 절차형
> **사용자**: Tong (디렉터) / 서브 에이전트
> **목적**: 브라우저 없이 DevSurvivor 게임의 부팅·상태·루프를 자동 검증한다

---

## 도구

- **Node.js** (항상 사용 가능)
- **Puppeteer** (`npm i -D puppeteer` — 미설치 시 Step 0 먼저)
- **대상**: `docs/index.html` (bundle.js 포함된 정적 파일)

---

## 실행 절차

### Step 0 — 환경 확인
```bash
node -e "require('puppeteer')" 2>/dev/null || npm install --save-dev puppeteer
```

### Step 1 — 스모크 테스트 스크립트 생성
`.claude/headless/smoke-test.js` 생성:

```javascript
const puppeteer = require('puppeteer')
const path = require('path')

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('file://' + path.resolve('docs/index.html'))
  await page.waitForFunction(() => window.GameState !== undefined, { timeout: 5000 })

  const checks = await page.evaluate(() => ({
    gameStateExists:    typeof window.GameState !== 'undefined',
    playerExists:       typeof window.GameState?.player !== 'undefined',
    charConfigsExist:   typeof window.CHAR_CONFIGS !== 'undefined',
    selectedChar:       window.GameState?.selectedCharacter,
    isRunning:          window.GameState?.isRunning === false,  // 로비 상태
  }))

  console.log('=== Smoke Test Results ===')
  console.log(JSON.stringify(checks, null, 2))

  if (errors.length > 0) {
    console.error('=== Console Errors ===')
    errors.forEach(e => console.error(' ❌', e))
  }

  // 게임 시작 시뮬
  await page.evaluate(() => window.Game?.start?.())
  await page.waitForFunction(() => window.GameState?.isRunning === true, { timeout: 3000 })
    .catch(() => { errors.push('Game.start() 후 isRunning이 true가 되지 않음') })

  // 60프레임 시뮬 (1초)
  await page.waitForFunction(() => window.GameState?.gameTime > 0, { timeout: 5000 })
    .catch(() => { errors.push('gameTime이 증가하지 않음 — 게임 루프 미작동') })

  const finalState = await page.evaluate(() => ({
    gameTime:   window.GameState?.gameTime,
    isRunning:  window.GameState?.isRunning,
    score:      window.GameState?.score,
    enemies:    window.GameState?.enemies?.length,
  }))
  console.log('=== Final State (after 1s sim) ===')
  console.log(JSON.stringify(finalState, null, 2))

  const passed = errors.length === 0 && Object.values(checks).every(v => v !== false)
  console.log(passed ? '\n✅ PASS' : '\n❌ FAIL')
  errors.forEach(e => console.error(' >', e))

  await browser.close()
  process.exit(passed ? 0 : 1)
})()
```

### Step 2 — 실행
```bash
node .claude/headless/smoke-test.js
```

### Step 3 — 결과 해석

| 체크 항목 | 실패 의미 |
|---------|---------|
| `gameStateExists` | bundle.js 로드 실패 or game.js 오류 |
| `charConfigsExist` | charsprites.js 누락 or 순서 오류 |
| `isRunning: false` | 로비 상태가 아닌 상태로 시작됨 |
| `gameTime > 0` | requestAnimationFrame 루프 미작동 |
| Console Errors | JS 에러 — 메시지 직접 확인 |

### Step 4 — manifest 연동
```
테스트 통과 시: manifest.json T010 status → "done"
실패 시: 오류 내용을 해당 태스크 assignee에게 전달
```

---

## 확장 테스트 (필요 시 추가)

```javascript
// 적 처치 경험치 검증
await page.evaluate(() => {
  const enemy = window.GameState.enemies[0]
  if (enemy) enemy.takeDamage(9999)
})
await page.waitForFunction(() => window.GameState?.player?.exp > 0, { timeout: 2000 })

// 레벨업 트리거 검증
// 사망 후 결과 화면 전환 검증
// localStorage 저장/복원 검증
```

---

## 주의
- `docs/index.html`이 대상. `game.js` 직접 실행 불가 (브라우저 전용 API 사용)
- 파일 프로토콜(`file://`)로 실행 — CORS 이슈 없음
- CI/CD 연동 시 `headless: 'new'` 유지 (deprecated 옵션 사용 금지)
