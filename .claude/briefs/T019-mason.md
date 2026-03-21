# Brief — T019 로비 포트레이트 fw>16 높이 기준 스케일 수정

**담당**: Mason
**발행**: Tong
**날짜**: 2026-03-22
**예상 소요**: 10분

---

## 목표

`ui/lobby.js`의 캐릭터 포트레이트 렌더 코드에서 `fw > 16` 분기를
**너비 기준 스케일 → 높이 기준 스케일**로 수정해
Adam·Amelia 캐릭터 전신이 로비 카드에 표시되도록 한다.

---

## 배경 (버그 원인)

현재 `fw > 16` 분기(Adam/Amelia, 32×32 스프라이트):

```js
// ❌ 현재 — 너비 기준 스케일
const scaleToW = (card.w - 4) / fw  // 166 / 32 = 5.19×
dispW = 166px
dispH = 166px   ← portraitH(92px) 초과
drawY = portraitY
```

- 렌더 높이 166px > 클립 높이 92px
- Tommy/Julia 캐릭터 본체는 스프라이트 하단 50~60%에 위치
- 캐릭터 본체가 클립 경계(92px) 아래에 걸려 머리 끝부분만 보임

---

## 수정 위치

`ui/lobby.js` — `_drawCharCards` 메서드 내 `else` 분기 (현재 약 189~195번 줄)

```js
// ❌ 수정 전
} else {
  // 대형 스프라이트: 너비에 맞춰 스케일 → 세로 clip
  const scaleToW = (card.w - 4) / fw
  dispW = card.w - 4
  dispH = fh * scaleToW
  drawX = card.x + 2
  drawY = portraitY
}
```

```js
// ✅ 수정 후
} else {
  // 대형 스프라이트: 높이에 맞춰 스케일 → 수평 중앙 정렬
  const scaleToH = (portraitH - 4) / fh
  dispH = portraitH - 4
  dispW = fw * scaleToH
  drawX = card.x + (card.w - dispW) / 2
  drawY = portraitY + 2
}
```

계산 결과 (32×32 스프라이트):
- `scaleToH = 88 / 32 = 2.75×`
- `dispH = 88px` ← portraitH(92px) 내에 완전히 들어옴
- `dispW = 88px` ← 카드 너비(170px) 내에서 중앙 정렬

또한 `imageSmoothingEnabled` 조건도 `fw > 16` → smoothing ON 이 맞으므로 그대로 유지.

---

## 추가 확인

수정 후 `ctx.drawImage` 호출:
```js
ctx.drawImage(idleImg, 0, 0, fw, fh, drawX, drawY, dispW, dispH)
```
- source: 첫 번째 프레임 (0, 0, 32, 32)
- dest: (drawX, drawY, 88, 88)
- 클립 범위(92px) 내 완전 렌더 ✅

---

## 검수 기준

- [ ] `node bundle.js` 성공
- [ ] `node .claude/headless/smoke-test.js` → `✅ PASS`
- [ ] Adam(tommy) 카드: 캐릭터 전신 또는 상반신 이상 표시
- [ ] Amelia(julia) 카드: 캐릭터 전신 또는 상반신 이상 표시
- [ ] Alex 카드 외형 변화 없음 (fw≤16 분기 미수정)

---

## 금지 사항

- `fw <= 16` 분기 수정 금지 (Alex 카드 — 이미 높이 기준으로 작동 중)
- `charBg` 색상 수정 금지
- `hud.js`, `result.js` 등 다른 파일 수정 금지

---

## 참조

- `ui/lobby.js:182~196` — 포트레이트 스케일 분기
- `agents/mason.md` — Mason 담당 범위

---

## 보고 형식

```
Done: [완료 요약]
Files Modified: ui/lobby.js, docs/index.html
ETD Actual: [분]분
Handoff: smoke-test 결과
```
