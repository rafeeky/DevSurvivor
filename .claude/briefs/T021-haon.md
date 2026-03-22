# Brief — T021 액티브 스킬 7종 강화 Lv3 구현

**담당**: Haon
**발행**: Tong
**날짜**: 2026-03-22
**예상 소요**: 25분

---

## 목표

`entities/skills.js`의 액티브 스킬 7종에 Lv1→Lv2→Lv3(MAX) 강화 로직을 구현하고,
`systems/levelup.js`에 5종의 강화 선택지(`_강화`)를 추가한다.

---

## 선행 조건

- [x] 없음 (T022-mason과 파일 교집합 없음 — 병렬 진행 가능)

---

## 산출물 명세

### `entities/skills.js`

#### 강화 스펙 (모든 스킬 maxLevel → 3)

| 스킬 | Lv1 | Lv2 | Lv3(MAX) |
|---|---|---|---|
| **긴급수정** | 피해 40, 반경 120px | 피해 60, 반경 120px | 피해 60, 반경 160px, 쿨→3초 |
| **디버그** | 피해 70, 1명 | 피해 100, 1명 | 피해 100, 2명, 쿨→1.5초 |
| **우선순위정리** | 피해 30, 반경 160px, 넉백 100px | 피해 45, 반경 180px | 피해 45, 반경 200px, 넉백 130px, 쿨→5초 |
| **커피 한 잔** | 속도+40% 5초, 쿨다운-20% | 속도+40% 7초 | 속도+60% 7초, 쿨→15초 |
| **피규어청소** | 피해감소 40% 4초, 넉백 120px | 피해감소 40% 5초 | 피해감소 50% 5초, 넉백 160px |
| **강아지** | HP 25% 회복 | HP 35% 회복 | HP 50% 회복, 쿨→12초 |
| **낮잠** | HP 50% (정지 1.5초) | HP 60% | HP 70%, 정지 1.0초, 쿨→25초 |

#### 구현 방식
- 각 `_skillMethod()` 내부에서 `def.level`로 분기
- `upgradeSkill()` maxLevel을 4→3으로 수정: `Math.min(3, ...)`

### `systems/levelup.js`

#### 추가할 `_강화` 선택지 (LEVEL_UP_CHOICES)

```js
'우선순위정리_강화': { label: '우선순위 정리 강화', desc: '피해+15 / 반경+20px / Lv3: 넉백+30px·쿨↓', type: 'upgradeSkill', skillId: '우선순위정리' },
'커피_강화':        { label: '커피 한 잔 강화',    desc: '지속+2초 / Lv3: 속도+60%·쿨↓',              type: 'upgradeSkill', skillId: '커피' },
'피규어청소_강화':  { label: '피규어청소 강화',     desc: '지속+1초 / Lv3: 피해감소+10%·넉백+40px',    type: 'upgradeSkill', skillId: '피규어청소' },
'강아지_강화':      { label: '강아지쓰다듬기 강화', desc: 'HP회복+10% / Lv3: HP회복+15%·쿨↓',          type: 'upgradeSkill', skillId: '강아지' },
'낮잠_강화':        { label: '낮잠자기 강화',       desc: 'HP회복+10% / Lv3: HP회복+10%·정지↓·쿨↓',   type: 'upgradeSkill', skillId: '낮잠' },
```

#### `_generateChoices()` 수정
보유 스킬 중 level < 3인 경우 강화 선택지 풀에 추가:
```js
if (ownedSlots.includes('우선순위정리') && sm.skillDefs['우선순위정리'].level < 3) choices.push(...)
// 나머지 4종 동일 패턴
```

---

## 검수 기준

- [ ] 7종 스킬 모두 level 1/2/3 분기 동작 확인 (코드 리뷰)
- [ ] upgradeSkill() maxLevel이 3 이하로 제한됨
- [ ] LEVEL_UP_CHOICES에 5종 _강화 키 추가됨
- [ ] _generateChoices()에서 강화 선택지가 올바르게 풀에 포함됨

---

## 금지 사항

- `ui/hud.js` 수정 금지 (T022-mason 담당)
- 패시브 스킬 로직 변경 금지
- `node bundle.js` 실행 금지 (Raf가 통합 빌드)

---

## 보고 형식

```
Done: [완료 요약]
Files Modified: entities/skills.js, systems/levelup.js
ETD Actual: [분]분
Handoff: 7종 강화 로직 완료, levelup 강화 선택지 추가 완료
```
