# Brief — T017 Alex 스프라이트 빌드타임 밝기 보정

**담당**: Raf
**발행**: Tong
**날짜**: 2026-03-22
**예상 소요**: 20분

---

## 목표

`bundle.js` 빌드 파이프라인에 Alex 스프라이트 밝기 보정 스텝을 추가하여,
어두운 픽셀 아트 캐릭터가 로비·인게임에서 뚜렷하게 보이도록 한다.

---

## 배경

Alex 스프라이트(`assets/characters/Alex_idle_16x16.png`, `Alex_run_16x16.png`)는
픽셀 색상이 어두운 갈색/검정 계열이다. 로비 카드 배경이 어두운 남색이므로
거의 구분이 안 되는 "어두운 덩어리"로 렌더된다.

Tommy 스프라이트는 `convertRGBtoRGBA()`로 빌드타임 처리(흰 배경 제거)되어
`assets/custom/player/tommy_*.png`로 저장된다. **Alex도 동일한 방식으로
빌드타임 밝기 보정 → 커스텀 경로 저장**이 필요하다.

---

## 선행 조건

- [x] bundle.js에 `convertRGBtoRGBA` 함수 존재 (PNG 읽기/쓰기 인프라 사용 가능)
- [x] assets/characters/Alex_idle_16x16.png, Alex_run_16x16.png 존재

---

## 산출물 명세

### 수정 1: `bundle.js` — Alex 밝기 보정 함수 + 실행 추가

**새 함수** `brightenSprite(inputPath, outputPath, factor)` 추가:

```js
// bundle.js에 추가할 함수 (convertRGBtoRGBA 근처에 배치)
function brightenSprite(inputPath, outputPath, factor = 1.8) {
  // 1. PNG 읽기 (기존 인프라 활용 — convertRGBtoRGBA 참고)
  // 2. 각 픽셀 RGB를 factor 배 밝게 (255 초과 클램핑)
  //    r = Math.min(255, r * factor)
  //    g = Math.min(255, g * factor)
  //    b = Math.min(255, b * factor)
  //    a = 원본 유지 (투명도 변경 없음)
  // 3. RGBA PNG로 출력
}
```

**실행 블록** (Tommy 변환 블록 아래에 추가):

```js
// Alex 스프라이트 밝기 보정
const ALEX_SRC = 'assets/characters'
const ALEX_DST = 'assets/custom/player'
const alexSprites = [
  { src: `${ALEX_SRC}/Alex_idle_16x16.png`, dst: `${ALEX_DST}/alex_idle.png` },
  { src: `${ALEX_SRC}/Alex_run_16x16.png`,  dst: `${ALEX_DST}/alex_run.png`  },
]
let alexCount = 0
for (const { src, dst } of alexSprites) {
  try { brightenSprite(src, dst, 1.8); alexCount++ } catch (e) { console.warn('⚠️ Alex 변환 실패:', src, e.message) }
}
if (alexCount > 0) console.log(`✅ Alex 스프라이트 밝기 보정 완료 (${alexCount}/2)`)
```

### 수정 2: `entities/charsprites.js` — Alex 경로 업데이트

```js
// 수정 전
idle: { src: 'assets/characters/Alex_idle_16x16.png', fw: 16, fh: 16, frames: 4, fps: 4 },
walk: { src: 'assets/characters/Alex_run_16x16.png',  fw: 16, fh: 16, frames: 6, fps: 8 },

// 수정 후
idle: { src: 'assets/custom/player/alex_idle.png', fw: 16, fh: 16, frames: 4, fps: 4 },
walk: { src: 'assets/custom/player/alex_run.png',  fw: 16, fh: 16, frames: 6, fps: 8 },
```

### 수정 3: `bundle.js` 재실행 → `docs/index.html` 재생성

```bash
node bundle.js
```

---

## `brightenSprite` 구현 참조

`convertRGBtoRGBA` 함수(bundle.js:167~)가 PNG 바이트 직접 처리 인프라를 갖고 있음.
동일 방식으로:
- IHDR에서 w, h, bitDepth, colorType 읽기
- 픽셀 데이터 추출
- RGB 또는 RGBA 여부 판단 후 처리
  - RGB(colorType=2): r,g,b 밝기 보정 후 RGBA로 출력
  - RGBA(colorType=6): r,g,b만 밝기 보정, a 유지

---

## 검수 기준

- [ ] `node bundle.js` 실행 시 `✅ Alex 스프라이트 밝기 보정 완료 (2/2)` 출력
- [ ] `assets/custom/player/alex_idle.png`, `alex_run.png` 생성됨
- [ ] `node .claude/headless/smoke-test.js` → `✅ PASS`
- [ ] 브라우저에서 로비 Alex 카드에 캐릭터 형태가 보임 (어두운 덩어리 아님)

---

## 금지 사항

- Tommy 스프라이트 변환 로직 수정 금지
- charsprites.js의 alex 이외 항목 수정 금지
- game.js / player.js 수정 금지

---

## 참조

- `bundle.js:167` — `convertRGBtoRGBA` 함수 (PNG 처리 인프라)
- `bundle.js:213` — Tommy 변환 블록 (패턴 참조)
- `entities/charsprites.js:23` — alex 설정 블록

---

## 보고 형식

```
Done: [완료 요약]
Files Modified: bundle.js, entities/charsprites.js, docs/index.html
ETD Actual: [실제 소요]분
Handoff: smoke-test 결과 + assets/custom/player/alex_*.png 생성 확인
```
