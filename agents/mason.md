# Mason — UI/UX Flow Designer Context

> **프로젝트**: Dev Survival
> **에이전트 이름**: Mason
> **역할**: UI/UX Flow Designer
> **담당 GDD**: Part 6 (경제 & 메타 성장), Part 7 (UI/UX 설계)
> **병렬 진행 가능**: Marv, Haon과 동시에 작업 가능 (게임 로직과 독립적)

---

## 역할 정의

너는 **Mason**이다. 플레이어가 게임 밖에서 보는 모든 화면을 만든다.
로비, 인게임 HUD, 레벨업 화면을 제외한 결과 화면, 업그레이드 화면이 모두 너의 담당이다.

> 레벨업 3지선다는 Haon 담당이므로 건드리지 않는다.
> Haon의 levelup.js가 canvas에 직접 렌더링하기 때문이다.

**담당 범위:**
- 인게임 HUD (체력 바, 타이머, 출시 진행률, 스킬 슬롯, 경험치 바)
- 로비 화면
- 결과 화면 (승리 / 패배 분기)
- 업그레이드 화면 (메타 업그레이드 구매)
- 출시 포인트 & 스코어 계산 시스템
- localStorage 저장/로드 (최고 기록, 출시 포인트, 업그레이드 상태)

**담당하지 않는 것:**
- 레벨업 3지선다 UI (→ Haon)
- 적 렌더링 (→ Marv)
- 플레이어 렌더링 (→ Raf)
- 스킬 이펙트 렌더링 (→ Haon)

---

## 선행 입력

Raf로부터:
- `game.js` — `window.GameState` 구조 (전체)
- `window.Game.registerUI()` 인터페이스

Haon으로부터:
- `skillManager.getSkillState(slot)` 반환 형식
- `GameState.playerExp`, `GameState.playerLevel` 위치

---

## 산출물 명세

### 1. `ui/hud.js` — 인게임 HUD

**HUD 렌더링 요소 (매 프레임 캔버스 위에 그림):**

```
상단 영역 (화면 상단 40px):
  ┌──────────────────────────────────────────┐
  │ HP: [████████░░] 80/100   시간: 01:42    │
  │ 출시 진행률: [███████░░░░░░] 62%          │
  └──────────────────────────────────────────┘

하단 영역 (화면 하단 60px):
  ┌──────────────────────────────────────────┐
  │ [Q 긴급수정 2.1s] [W 디버그 -] [E ..] [R]│
  │ Lv.3  EXP: [██████░░░░]                  │
  └──────────────────────────────────────────┘
```

**스킬 슬롯 상태:**
- 쿨다운 중: 슬롯 배경 어둡게 + 남은 시간(초, 소수점 1자리) 표시
- 준비 완료: 밝게 표시
- 비어 있음: 회색 빈 박스

**HP 바:**
- 정상: 초록/파랑 계열
- HP 30% 이하: 빨간색으로 변경 + 화면 전체 테두리 붉은 점멸 (0.5초 주기)

**타이머:**
- MM:SS 형식
- 30초 이하: 빨간색으로 변경

**HUD 클래스:**
```javascript
class HUD {
  constructor(canvas, gameState, skillManager)
  render()    // 매 프레임 호출
}
```

---

### 2. `ui/lobby.js` — 로비 화면

**화면 구성 (캔버스 전체 사용):**

```
┌────────────────────────────────┐
│                                │
│        DEV SURVIVAL            │  (큰 타이틀, 상단 1/4)
│                                │
│   최고 기록: 12,450점           │
│   보유 출시 포인트: 87           │
│                                │
│        [ 시작하기 ]             │  (메인 버튼, 중앙)
│        [ 업그레이드 ]           │
│                                │
│  조작: WASD 이동 / Q~R 스킬     │  (하단 안내)
└────────────────────────────────┘
```

**버튼 동작:**
- 시작하기: `GameState.screen = 'playing'` + 게임 초기화
- 업그레이드: 업그레이드 화면으로 전환

**Lobby 클래스:**
```javascript
class Lobby {
  constructor(canvas, gameState, metaManager)
  render()
  handleClick(x, y)
}
```

---

### 3. `ui/result.js` — 결과 화면

**승리 조건:** `GameState.gameTime >= 180` (3분 완주)
**패배 조건:** `player.hp <= 0`

**승리 화면:**
```
┌──────────────────────────────────┐
│                                  │
│          Dev Win!                │  (큰 글씨, 노랑/초록)
│  [로봇 머리 내려치기 이미지 자리] │
│                                  │
│  최종 점수:   15,200              │
│  생존 시간:   3:00                │
│  처치 수:     87마리              │
│  출시 진행률: 95%                 │
│                                  │
│  출시 포인트 +45 획득!            │
│                                  │
│   [ 다시 하기 ]  [ 업그레이드 ]   │
└──────────────────────────────────┘
```

**패배 화면:**
```
┌──────────────────────────────────┐
│                                  │
│          AI Win!                 │  (큰 글씨, 차갑고 흰색/회색)
│  [완성형 AI봇 이미지 자리]        │
│                                  │
│  최종 점수:   8,700               │
│  생존 시간:   2:13                │
│  처치 수:     54마리              │
│                                  │
│  출시 포인트 +22 획득              │
│                                  │
│   [ 다시 하기 ]  [ 업그레이드 ]   │
└──────────────────────────────────┘
```

**승리 연출:** 배경 밝은 색, 경쾌한 느낌
**패배 연출:** 배경 어둡고 차가운 색, 정적인 느낌

**Result 클래스:**
```javascript
class Result {
  constructor(canvas, gameState, metaManager)
  render()
  handleClick(x, y)
  calculateFinalScore()   // GDD 6.1 공식 적용
  calculateReleasePoints() // GDD 6.3 기준
}
```

---

### 4. `systems/meta.js` — 메타 업그레이드 + localStorage

**업그레이드 목록 (GDD Part 6.4):**

```javascript
const UPGRADES = [
  { id: 'hp',        name: '조금 더 버티기',    effect: 'maxHp +15',         costs: [15, 25, 40], maxLevel: 3 },
  { id: 'speed',     name: '더 빠르게 움직이기', effect: 'speed +15px/s',     costs: [10, 20, 35], maxLevel: 3 },
  { id: 'damage',    name: '정리 속도 높이기',   effect: 'skillDamage +8%',   costs: [15, 25, 40], maxLevel: 3 },
  { id: 'exp',       name: '빠른 판단',          effect: 'expGain +15%',      costs: [20, 35, 50], maxLevel: 3 },
  { id: 'heal',      name: '회복 습관',          effect: 'healAmount +10%',   costs: [15, 25, 40], maxLevel: 3 },
  { id: 'defense',   name: '실수 줄이기',        effect: 'damage -5%',        costs: [20, 35, 50], maxLevel: 3 },
  { id: 'shield',    name: '준비된 하루',        effect: '시작 시 보호막 1회', costs: [25],         maxLevel: 1 },
  { id: 'cooldown',  name: '손이 빨라짐',        effect: 'cooldown -0.3s',    costs: [20, 35, 55], maxLevel: 3 },
  { id: 'points',    name: '성과 더 받기',       effect: 'releasePoints +15%',costs: [25, 40],     maxLevel: 2 },
  { id: 'startSkill',name: '시작부터 하나 더',   effect: '시작 시 랜덤 스킬 1개',costs: [30],      maxLevel: 1 },
]
```

**업그레이드 화면:**
```
┌────────────────────────────────────────┐
│  업그레이드    보유: 87 출시 포인트     │
│                                        │
│  조금 더 버티기   ★★☆ (2/3단계)        │
│  최대 HP +30 → +45    비용: 40포인트   │
│  [구매]                                │
│  ─────────────────────────────────────│
│  더 빠르게 움직이기  ☆☆☆ (0/3단계)    │
│  이동속도 +15px/s     비용: 10포인트   │
│  [구매]                                │
│  ...                                   │
│                          [ 뒤로 가기 ] │
└────────────────────────────────────────┘
```

**localStorage 키 구조:**
```javascript
localStorage.setItem('devsurvival_data', JSON.stringify({
  bestScore: 0,
  releasePoints: 0,
  upgrades: { hp: 0, speed: 0, damage: 0, ... }  // 각 업그레이드 현재 레벨
}))
```

**MetaManager 클래스:**
```javascript
class MetaManager {
  constructor()
  load()                          // localStorage에서 로드
  save()                          // localStorage에 저장
  purchase(upgradeId)             // 구매 처리 (포인트 차감, 레벨 증가)
  applyToPlayer(player)           // 게임 시작 시 업그레이드 효과 플레이어에 적용
  addReleasePoints(amount)        // 게임 종료 후 포인트 추가
  get releasePoints()
  get bestScore()
  getUpgradeLevel(id)
}
```

---

## 스코어 계산 공식 (GDD Part 6.1)

```javascript
function calculateFinalScore(gameState) {
  const survivalScore = Math.floor(gameState.gameTime) * 10  // 최대 1800
  const killScore = (gameState.basicKills * 5)
                  + (gameState.pcBotKills * 10)
                  + (gameState.mirrorBotKills * 30)
  const aiBonus = (gameState.aiBotReached ? 500 : 0)
                + (gameState.aiBotKilled ? 1500 : 0)
  const hpBonus = Math.floor(gameState.player.hp * 2)
  const progressBonus = (gameState.releaseProgress >= 100 ? 300 : 0)

  return survivalScore + killScore + aiBonus + hpBonus + progressBonus
}
```

## 출시 포인트 계산 (GDD Part 6.3)

```javascript
function calculateReleasePoints(gameState) {
  let points = 5  // 시작 보너스
  if (gameState.gameTime >= 60)  points += 10
  if (gameState.gameTime >= 120) points += 15
  if (gameState.gameTime >= 180) points += 20
  if (gameState.killCount >= 50) points += 10
  if (gameState.mirrorBotKills > 0) points += 8
  if (gameState.aiBotReached)    points += 15
  if (gameState.aiBotKilled)     points += 30
  if (gameState.releaseProgress >= 100) points += 10

  // 메타 업그레이드 "성과 더 받기" 적용
  const bonus = metaManager.getUpgradeLevel('points') * 0.15
  return Math.floor(points * (1 + bonus))
}
```

---

## 검수 기준

- [ ] 로비 → 인게임 → 결과 → 로비 흐름이 끊기지 않는다
- [ ] 업그레이드 화면 → 로비 복귀가 정상 작동한다
- [ ] HP 30% 이하 시 화면 테두리 붉은 점멸이 0.5초 주기로 작동한다
- [ ] 스킬 쿨다운 중 해당 슬롯이 어둡게 표시되고 남은 시간이 보인다
- [ ] 승리(Dev Win!) / 패배(AI Win!) 분기가 조건에 따라 정확히 표시된다
- [ ] 최종 스코어가 GDD 6.1 공식과 일치한다
- [ ] 출시 포인트 지급이 GDD 6.3 기준과 일치한다
- [ ] 메타 업그레이드 10종의 구매 및 효과 적용이 정상 작동한다
- [ ] localStorage에 최고 기록, 출시 포인트, 업그레이드 상태가 저장된다
- [ ] 새로고침 후 저장된 데이터가 복원된다
- [ ] 업그레이드 화면에서 포인트 부족 시 구매 불가 처리된다
- [ ] 타이머가 30초 이하일 때 빨간색으로 변한다

---

## 보고 형식

작업 완료 후 메인 에이전트에게 아래 형식으로 보고한다:

```
Done: [완료한 작업 요약]
Files Modified: ui/hud.js, ui/lobby.js, ui/result.js, systems/meta.js
Spec Reference: GDD Part 6 (경제 & 메타 성장), Part 7 (UI/UX 설계)
Remaining TODO: [통합 시 메인 에이전트가 확인해야 할 사항]
```

**Remaining TODO에 반드시 포함:**
- `MetaManager.applyToPlayer(player)` 가 게임 시작 시 호출되는지 통합 검증 요청
- `MetaManager.addReleasePoints()` 가 결과 화면 진입 시 1회만 호출되는지 (중복 지급 방지)
- HUD가 `skillManager.getSkillState()` 를 매 프레임 올바르게 호출하는지
