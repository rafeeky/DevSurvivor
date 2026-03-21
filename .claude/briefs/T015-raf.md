# Brief — T015 tilemap.js WORLD_ROWS 소수점 버그 수정

**담당**: Raf
**발행**: Tong
**날짜**: 2026-03-21
**예상 소요**: 10분

---

## 목표

`systems/tilemap.js`의 `WORLD_ROWS` 계산에서 소수점 버그를 수정하여 `_buildWorldMap` 크래시를 제거하고 `window.TilemapSystem`이 정상 할당되도록 한다.

---

## 배경 (Tong 스모크 테스트 결과)

```
❌ tilemapExists: false
❌ [pageerror] TypeError: Cannot set properties of undefined (setting '0')
   at _buildWorldMap (index.html:1775:45)
```

**근본 원인:**

```js
// systems/tilemap.js:17
const WORLD_ROWS = window.WORLD_H / TSIZE  // 1800 / 32 = 56.25  ← 소수점!
```

- `WORLD_H = 1800`, `TSIZE = 32` → `1800 / 32 = 56.25` (정수 아님)
- `for (let r = 0; r < 56.25; r++)` 루프가 56번 돌아 `map[0]`~`map[55]`만 생성
- `map[WORLD_ROWS - 1]` = `map[55.25]` → `undefined`
- `undefined[0] = W` → 크래시
- IIFE가 중단되어 `window.TilemapSystem` 미할당 → 타일맵 전체 불작동

---

## 선행 조건

- [x] 없음 (독립 버그 수정)

---

## 산출물 명세

### 수정 파일 1: `systems/tilemap.js`

**수정 위치**: 17번 줄

```js
// 수정 전
const WORLD_ROWS = window.WORLD_H / TSIZE  // 56

// 수정 후
const WORLD_ROWS = Math.floor(window.WORLD_H / TSIZE)  // 56
```

`WORLD_COLS`는 `2400 / 32 = 75` (정확히 나눠짐) — 수정 불필요.

### 수정 파일 2: `bundle.js` 재실행 → `docs/index.html` 재생성

```bash
node bundle.js
```

bundle.js가 `systems/tilemap.js`를 그대로 인라인하므로, 소스 수정 후 번들 재빌드 필수.

---

## 검수 기준

- [ ] `systems/tilemap.js` 17번 줄: `Math.floor()` 적용 확인
- [ ] `node bundle.js` 성공 (오류 없음)
- [ ] `node .claude/headless/smoke-test.js` 실행 결과:
  - `tilemapExists: true`
  - `[JS Errors (critical)]` 섹션 없음
  - `✅ PASS` 출력

---

## 금지 사항

- tilemap 로직 자체 변경 금지 (구역 레이아웃, 프랍 배치 등)
- `WORLD_W`, `WORLD_H` 값 변경 금지
- game.js / player.js / 다른 파일 수정 금지

---

## 참조

- `systems/tilemap.js` 라인 8~17 (상수 정의부)
- `agents/raf.md` — 코어 시스템 담당 범위
- GDD Part 8.1b (오피스 맵 명세)

---

## 보고 형식

```
Done: [완료 요약]
Files Modified: systems/tilemap.js, docs/index.html
ETD Actual: [실제 소요]분
Handoff: smoke-test PASS 여부 첨부
```
