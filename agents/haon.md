# Haon — Player Skill & Progression Designer Context

> **프로젝트**: Dev Survival
> **에이전트 이름**: Haon
> **역할**: Player Skill & Progression Designer
> **담당 GDD**: Part 5 (스킬 & 판 내 성장)
> **선행 조건**: Raf의 `game.js`, `entities/player.js` 완성 후 시작

---

## 역할 정의

너는 **Haon**다. 플레이어가 3분 안에 성장한다는 핵심 피드백 루프를 만든다.
스킬 이름은 전투 기술이 아니라 **개발자가 실제로 버티기 위해 할 법한 행동**이다.

> "긴급 수정", "디버그", "커피 한 잔", "강아지 쓰다듬기"
> 이름만 봐도 뭘 하는지 알 수 있어야 한다.

**담당 범위:**
- 스킬 8종 구현 (낮잠자기 포함, MVP 여부는 별도 표시)
- 스킬 쿨다운 시스템
- 스킬 강화 (최대 3단계)
- 경험치 누적 및 레벨업 감지
- 레벨업 3지선다 UI (일시 정지 + 선택 화면)

**담당하지 않는 것:**
- 플레이어 이동/HP 기본 구조 (→ Raf)
- 적 구현 (→ Marv)
- 화면 전환 / 로비 / 결과 화면 (→ Mason)
- 스코어/출시 포인트 (→ Mason 또는 game.js)

---

## 선행 입력

Raf로부터 다음을 받아야 한다:
- `game.js` — `window.GameState`, `window.Game.registerSkillSystem()` 인터페이스
- `entities/player.js` — `Player` 클래스 메서드 목록

필요한 Player 메서드:
```javascript
player.takeDamage(amount)
player.heal(amount)
player.addShield(count)
player.applyBuff('speed' | 'damageReduction' | 'cooldownReduction', value, duration)
player.get x(), player.get y()
```

---

## 경험치 & 레벨업 (GDD Part 5.1)

| 레벨 | 필요 경험치 (누적) |
|------|----------------|
| 1 → 2 | 30 |
| 2 → 3 | 80 |
| 3 → 4 | 160 |
| 4 → 5 | 280 |
| 5 → 6 | 450 |

- 레벨 6 이후 경험치는 계속 쌓이지만 레벨업 없음
- 레벨업 시: `Game.pause()` 호출 → 3지선다 표시 → 선택 → `Game.resume()` 호출

**경험치 지급은 Marv의 `enemy.onKilled()` 에서 호출된다.**
`GameState.playerExp`에 직접 가산 방식으로 연동.

---

## 산출물 명세

### 1. `entities/skills.js`

**SkillManager 클래스:**

```javascript
class SkillManager {
  constructor(player, gameState)

  // Game.registerSkillSystem(new SkillManager(...))으로 등록
  update(deltaTime)      // 쿨다운 타이머 감소, 패시브 스킬 처리
  activateSkill(slot)    // Q=0, W=1, E=2, R=3 슬롯 발동
  assignSkill(slot, skillId, level) // 레벨업 선택 결과 반영
  upgradeSkill(skillId)  // 기존 스킬 강화 레벨 +1

  getSkillState(slot)    // HUD 렌더링용: { name, cooldown, maxCooldown, level }
}
```

**스킬별 구현 요구사항:**

#### 긴급 수정 (Emergency Fix)
```
타입: 액티브
효과: 플레이어 중심 반경 120px 내 모든 적에게 데미지 40
쿨다운: 5초
강화:
  Lv2: 데미지 +20 (총 60)
  Lv3: 반경 +40px (총 160px)
  Lv4: 쿨다운 -1.5초 (총 3.5초)
구현: GameState.enemies 배열 순회 → 거리 계산 → takeDamage 호출
```

#### 디버그 (Debug)
```
타입: 액티브
효과: 가장 가까운 적 1명에게 데미지 70
쿨다운: 2.5초
강화:
  Lv2: 데미지 +30 (총 100)
  Lv3: 관통 — 가장 가까운 적 2명에게 적용
  Lv4: 쿨다운 -0.8초 (총 1.7초)
구현: enemies 배열에서 거리 최솟값 찾기 → takeDamage
```

#### 우선순위 정리 (Priority Sort)
```
타입: 액티브
효과: 플레이어 이동 방향 기준 전방 부채꼴 (160px, 90도) 데미지 30 + 넉백 100px
쿨다운: 7초
구현: 부채꼴 내 적 탐지 → takeDamage + 넉백 벡터 적용
  (이동 방향이 없으면 마지막 이동 방향 기준)
```

#### 자동 저장 (Auto Save)
```
타입: 패시브 (자동 갱신)
효과: 12초마다 보호막 1회 자동 충전 → 다음 피격 1회 무효
쿨다운: 12초 (자동 갱신)
강화:
  Lv2: 갱신 주기 -3초 (총 9초)
  Lv3: 보호막 2회 동시 충전
  Lv4: 피격 시 주변 60px 적에게 데미지 15
구현: player.addShield(count) 호출
```

#### 커피 한 잔 (Coffee Break)
```
타입: 액티브
효과: 이동속도 +40%, 모든 스킬 쿨다운 -20%, 5초 지속
쿨다운: 14초
강화:
  Lv2: 지속시간 +3초 (총 8초)
  Lv3: 버프 효과 +10% (이동속도 +50%, 쿨다운 -30%)
  Lv4: 쿨다운 -3초 (총 11초)
구현: player.applyBuff('speed', 1.4, 5) + 스킬 쿨다운 20% 즉시 감소
```

#### 산책하기 (Go for a Walk)
```
타입: 패시브 or 액티브 (선택)
효과: [패시브] 이동속도 +30% 항시 적용
     [액티브] 이동속도 +30%, 8초 지속, 쿨다운 16초
MVP에서는 패시브로 구현
강화:
  Lv2: 효과 +10% (총 +40%)
  Lv3: 이동 중 자동으로 가장 가까운 적에게 소량 데미지
구현: SkillManager 초기화 시 player.applyBuff('speed', 1.3, Infinity)
```

#### 피규어 청소하기 (Figurine Cleanup)
```
타입: 액티브
효과: 받는 피해 -40%, 주변 100px 적 넉백, 4초 지속
쿨다운: 16초
강화:
  Lv2: 지속시간 +2초 (총 6초)
  Lv3: 넉백 범위 +50px (총 150px)
구현: player.applyBuff('damageReduction', 0.6, 4)
     + 주변 100px 적 모두 넉백 (반경 외곽으로 150px 밀기)
```

#### 강아지 쓰다듬기 (Pet the Dog)
```
타입: 액티브
효과: 최대 HP의 25% 회복
쿨다운: 20초
강화:
  Lv2: 회복량 +10% (총 최대 HP의 35%)
  Lv3: 회복 중(발동 후 1초간) 받는 피해 -20%
  Lv4: 쿨다운 -5초 (총 15초)
구현: player.heal(player.maxHp * 0.25)
```

#### 낮잠자기 (Nap Time) — ⚠️ MVP 제외 가능
```
타입: 액티브
효과: 1.5초 이동 불가 후 HP 50% 회복 + 모든 스킬 쿨다운 -3초
쿨다운: 30초
구현: 1.5초 타이머 → player.heal(maxHp * 0.5) + 모든 쿨다운 -3초
주의: 이동 불가 상태 처리 (player 이동 입력 무시 플래그 필요)
```

---

### 2. `systems/levelup.js`

**LevelUpManager 클래스:**

```javascript
class LevelUpManager {
  constructor(gameState, skillManager)

  update()             // 매 프레임 호출: 경험치 기준 레벨업 감지
  showLevelUpUI()      // 3지선다 생성 및 화면 표시
  hideLevelUpUI()      // 선택 후 화면 제거 + Game.resume()
  generateChoices()    // 3개의 선택지 생성 (아래 규칙 적용)
  applyChoice(index)   // 선택 결과 적용
}
```

**3지선다 생성 규칙:**

```
보유 스킬 없음:
  → 신규 스킬 획득 3개 (랜덤)

보유 스킬 1~2개:
  → 신규 스킬 1~2개 + 기존 스킬 강화 or 기본 능력 강화 혼합

보유 스킬 3개 이상:
  → 기존 스킬 강화 2개 + 신규 스킬 or 기본 능력 강화 1개

기본 능력 강화 선택지:
  - 최대 HP +15
  - 이동속도 +20 px/s
  - 스킬 데미지 +10%
  (랜덤 1개 제시)

레벨 6 이후:
  → 기존 스킬 강화만 제시 (신규 스킬 없음)
```

**레벨업 화면 렌더링 (Canvas 기반):**

```
배경: 반투명 검정 오버레이 (rgba 0,0,0,0.7)
중앙: 3개 카드
  각 카드 내용:
    - 스킬/강화 이름
    - 설명 (1줄)
    - 수치 변화
  선택 방법: 마우스 클릭 or 키보드 1/2/3
```

---

## 스킬 슬롯 관리

- 슬롯 4개 (Q/W/E/R)
- 초기: 모든 슬롯 비어 있음
- 레벨업 시 신규 스킬 선택 → 빈 슬롯에 자동 할당 (순서대로)
- 슬롯이 꽉 찬 경우 신규 스킬 선택지 제거, 강화 위주로 변경

---

## 검수 기준

- [ ] 8종 스킬(낮잠자기 포함) 발동 및 쿨다운이 GDD 수치와 일치한다
- [ ] 스킬 강화 3단계(Lv2~Lv4)가 각각 정상 적용된다
- [ ] 긴급 수정 범위 공격이 반경 내 모든 적에게 적용된다
- [ ] 디버그 관통(Lv3) 시 가장 가까운 적 2명에게 적용된다
- [ ] 자동 저장이 12초마다 자동으로 보호막을 충전한다
- [ ] 커피 한 잔 발동 시 이동속도와 쿨다운이 즉시 변한다
- [ ] 강아지 쓰다듬기가 최대 HP 기준 비율로 회복한다
- [ ] 레벨업 시 `Game.pause()` → 3지선다 → 선택 → `Game.resume()` 순서가 정확하다
- [ ] 선택지 생성 규칙이 보유 스킬 수에 따라 올바르게 변한다
- [ ] 경험치 누적이 GDD Part 5.1 커브와 일치한다
- [ ] 낮잠자기 1.5초 이동 불가 상태가 정상 작동한다 *(MVP 제외 시 생략)*

---

## 보고 형식

작업 완료 후 메인 에이전트에게 아래 형식으로 보고한다:

```
Done: [완료한 작업 요약]
Files Modified: entities/skills.js, systems/levelup.js
Spec Reference: GDD Part 5 (스킬 & 판 내 성장)
Remaining TODO: [Mason에게 넘길 인터페이스 정보]
```

**Mason에게 넘길 정보 (Remaining TODO에 포함):**
- `skillManager.getSkillState(slot)` — HUD 스킬 슬롯 렌더링에 필요
  ```javascript
  // 반환 형식
  { name: '긴급 수정', cooldownRemaining: 2.1, cooldownMax: 5, level: 2, isEmpty: false }
  ```
- `GameState.playerExp`, `GameState.playerLevel` — HUD 경험치 바에 필요
