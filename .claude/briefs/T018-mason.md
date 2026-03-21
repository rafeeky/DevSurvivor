# Brief — T018 Alex 로비 카드 배경 대비 개선

**담당**: Mason
**발행**: Tong
**날짜**: 2026-03-22
**예상 소요**: 10분

---

## 목표

`ui/lobby.js`에서 Alex 로비 카드의 배경색을 개선하고,
소형 스프라이트(fw≤16) 뒤에 밝은 원형 후광을 추가하여
Alex 캐릭터가 뚜렷하게 보이도록 한다.

---

## 배경

Alex 카드 배경색이 `#0d2234`(짙은 남색)로 설정되어 있어서,
어두운 색상의 Alex 스프라이트와 대비가 없어 캐릭터가
"검은 덩어리"처럼 보인다.

T017(Raf)이 스프라이트 밝기를 높여주지만,
Mason은 배경 대비를 UI 레벨에서 추가 보완한다.

---

## 선행 조건

- [x] 없음 (T017과 파일 겹침 없어 병렬 진행 가능)

---

## 산출물 명세

### 수정 위치: `ui/lobby.js`

#### 수정 1 — Alex 카드 배경색 변경 (lobby.js:174)

```js
// 수정 전
const charBg = { adam: '#0e1f3a', alex: '#0d2234', amelia: '#1a1230' }

// 수정 후 — Alex를 더 밝은 청회색으로
const charBg = { adam: '#0e1f3a', alex: '#0e2a3f', amelia: '#1a1230' }
```

#### 수정 2 — 소형 스프라이트 후광 추가 (lobby.js:196 근처, drawImage 직전)

`fw <= 16` 분기 내, `ctx.drawImage` 호출 **전에** 원형 그라디언트 후광 삽입:

```js
// 소형 스프라이트 후광 (16x16 픽셀아트 캐릭터 가시성 향상)
const glowCX = drawX + dispW / 2
const glowCY = drawY + dispH / 2
const glowR  = dispW * 0.6
const grd = ctx.createRadialGradient(glowCX, glowCY, 0, glowCX, glowCY, glowR)
grd.addColorStop(0,   'rgba(180,210,255,0.18)')
grd.addColorStop(0.5, 'rgba(120,170,255,0.08)')
grd.addColorStop(1,   'rgba(0,0,0,0)')
ctx.fillStyle = grd
ctx.fillRect(drawX, drawY, dispW, dispH)
// (이후 기존 ctx.drawImage 호출)
```

---

## 주의 사항

- 후광은 `fw <= 16` 분기 내에만 추가 (Adam, Amelia는 대형 스프라이트라 불필요)
- `ctx.save()` / `ctx.restore()` 블록 **안에서** 작업 (이미 존재하는 구조 활용)
- Adam, Amelia 카드 배경색(`charBg.adam`, `charBg.amelia`) 변경 금지
- `ui/hud.js`, `ui/result.js` 등 다른 UI 파일 수정 금지

---

## 검수 기준

- [ ] 로비에서 Alex 카드의 캐릭터 형태가 배경과 구분됨
- [ ] Adam, Amelia 카드 외형 변화 없음
- [ ] `node bundle.js` → `docs/index.html` 재생성 성공
- [ ] `node .claude/headless/smoke-test.js` → `✅ PASS`

---

## 참조

- `ui/lobby.js:168~212` — 캐릭터 프리뷰 렌더 블록
- `ui/lobby.js:174` — charBg 정의
- `agents/mason.md` — Mason 담당 범위

---

## 보고 형식

```
Done: [완료 요약]
Files Modified: ui/lobby.js, docs/index.html
ETD Actual: [실제 소요]분
Handoff: 로비 Alex 카드 시각 개선 확인
```
