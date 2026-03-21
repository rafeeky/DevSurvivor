# Brief — T020 인게임 캐릭터 스프라이트 scale 상향

**담당**: Raf
**발행**: Tong
**날짜**: 2026-03-22
**예상 소요**: 10분

---

## 목표

`entities/charsprites.js`에서 adam·amelia·alex의 `scale` 값을 상향해
인게임에서 캐릭터가 더 크고 뚜렷하게 보이도록 한다.

---

## 배경 (버그 원인)

현재 인게임 플레이어 렌더:

```js
// player.js:252-258
const scale = cfg.scale || 1
const dw = anim.fw * scale  // adam: 32 * 2 = 64px
const dh = anim.fh * scale  // adam: 32 * 2 = 64px
const anchor = cfg.yAnchor ?? 0.75
const ry = y - dh * anchor  // y - 48
```

- adam/amelia: `scale:2` → 64×64px 렌더
- alex: `scale:3` → 48×48px 렌더
- 800×600 캔버스에서 64px = 8% 화면 높이 → 너무 작음
- 캐릭터 본체가 스프라이트 하단에 있어 머리·상체만 두드러져 보임

---

## 수정 위치

`entities/charsprites.js` — CHAR_CONFIGS의 각 캐릭터 `scale` 값

```js
// ✅ 수정 후
adam: {
  ...
  scale: 3,      // 2 → 3 (96×96px)
  yAnchor: 0.75,
},
alex: {
  ...
  scale: 4,      // 3 → 4 (64×64px, 16×16 원본이라 4배)
  yAnchor: 0.75,
},
amelia: {
  ...
  scale: 3,      // 2 → 3 (96×96px)
  yAnchor: 0.75,
},
```

**scale 계산 근거:**
- adam (32×32): scale 3 → 96×96px → 화면 높이의 16% ✅
- amelia (32×32): scale 3 → 96×96px ✅
- alex (16×16): scale 4 → 64×64px ✅ (scale 3이면 48px로 너무 작음)

---

## 검수 기준

- [ ] `node bundle.js` 성공
- [ ] `node .claude/headless/smoke-test.js` → `✅ PASS`
- [ ] charsprites.js adam scale: 3, amelia scale: 3, alex scale: 4 확인

---

## 금지 사항

- `player.js` 수정 금지 (player.js의 렌더 로직은 건드리지 않음)
- `yAnchor` 값 수정 금지
- `fw`, `fh`, `fps`, `frames` 등 다른 필드 수정 금지
- idle/walk/action/hit src 경로 수정 금지

---

## 참조

- `entities/charsprites.js:8~48` — CHAR_CONFIGS 전체
- `entities/player.js:252~258` — scale 적용 코드 (참조만)
- `agents/raf.md` — Raf 담당 범위

---

## 보고 형식

```
Done: [완료 요약]
Files Modified: entities/charsprites.js, docs/index.html
ETD Actual: [분]분
Handoff: smoke-test 결과
```
