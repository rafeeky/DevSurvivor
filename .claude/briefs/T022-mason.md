# Brief — T022 HUD 스킬 슬롯 레벨 표시 (LV.1 / LV.2 / LV.MAX)

**담당**: Mason
**발행**: Tong
**날짜**: 2026-03-22
**예상 소요**: 10분

---

## 목표

`ui/hud.js`의 스킬 슬롯 4개에 현재 스킬 레벨을 "LV.1", "LV.2", "LV.MAX"로 표시한다.

---

## 선행 조건

- [x] 없음 (T021-haon과 파일 교집합 없음 — 병렬 진행 가능)

---

## 산출물 명세

### `ui/hud.js` — `_drawBottomBar()` 내 스킬 슬롯 렌더

`getSkillState(i)`가 이미 `level` 필드를 반환함.

#### 표시 규칙
- level 1 → "LV.1" (색상: `#888899`)
- level 2 → "LV.2" (색상: `#aaccff`)
- level 3 → "LV.MAX" (색상: `#FFD700`, 금색 강조)

#### 렌더 위치
슬롯 우하단 영역 (sx+58 ~ sx+98, sy+26 ~ sy+36 근처).
쿨다운 숫자와 겹치지 않도록 쿨다운 미표시 시에만 레벨 표시.
READY 텍스트를 레벨 표시로 교체: READY 대신 "LV.X" 표시.

#### 예시 코드 (READY 대체)
```js
// 기존
} else {
  ctx.fillStyle = '#44ff88'
  ctx.font = '10px "VT323", monospace'
  ctx.fillText('READY', sx + 52, sy + 36)
}

// 수정 후
} else {
  const lv = state.level || 1
  const lvLabel = lv >= 3 ? 'LV.MAX' : `LV.${lv}`
  const lvColor = lv >= 3 ? '#FFD700' : lv === 2 ? '#aaccff' : '#888899'
  ctx.fillStyle = lvColor
  ctx.font = 'bold 10px "VT323", monospace'
  ctx.fillText(lvLabel, sx + 52, sy + 36)
}
```

---

## 검수 기준

- [ ] 슬롯에 READY 대신 LV.1 / LV.2 / LV.MAX 표시됨
- [ ] LV.MAX는 금색(#FFD700)으로 표시됨
- [ ] 쿨다운 중일 때는 레벨 표시 없음 (쿨다운 숫자만)
- [ ] 빈 슬롯에는 표시 없음 (state.isEmpty 유지)

---

## 금지 사항

- `entities/skills.js`, `systems/levelup.js` 수정 금지 (T021-haon 담당)
- 쿨다운 바, 아이콘, 키 레이블 등 기존 요소 레이아웃 변경 금지
- `node bundle.js` 실행 금지

---

## 보고 형식

```
Done: [완료 요약]
Files Modified: ui/hud.js
ETD Actual: [분]분
Handoff: HUD 레벨 표시 완료
```
