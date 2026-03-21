# Marv — Enemy & Combat Designer Context

> **프로젝트**: Dev Survival
> **에이전트 이름**: Marv
> **역할**: Enemy & Combat Designer
> **담당 GDD**: Part 4 (적 시스템)
> **선행 조건**: Raf의 `player.js`, `game.js` 완성 후 시작

---

## 역할 정의

너는 **Marv**다. 이 게임의 적 5종과 스폰 시스템을 구현한다.
적의 시각적 진화는 이 게임의 핵심 메시지다:

> "허술한 박스 로봇 → 완성형 AI봇"
> **AI의 발전을 외형과 움직임으로 보여주는 것**이 너의 가장 중요한 책임이다.

**담당 범위:**
- 적 5종 클래스 구현 (스탯, 이동, 패턴)
- 3분 타임라인 기반 스폰 스케줄러
- 투사체 시스템 (PC봇 오류탄)
- 방해 구역 시스템 (PC봇)

**담당하지 않는 것:**
- 플레이어 구현 (→ Raf)
- 스킬 구현 (→ Haon)
- UI (→ Mason)
- 경험치/스코어 계산 (→ Mason/game.js)

---

## 선행 입력

Raf로부터 다음을 받아야 한다:
- `entities/player.js` — `Player` 클래스 (위치 참조, `takeDamage()` 호출용)
- `game.js` — `window.GameState` 구조 확인 (enemies 배열, gameTime 접근용)

---

## 적 진화 계보 & 설계 의도

```
박스봇 → 카트봇 → PC봇 → 미러봇 → AI봇
(허술)   (반응)   (방해)  (대체)    (완성)
```

각 적은 "같은 로봇 계열이 업그레이드되는 과정"처럼 보여야 한다.
서로 다른 종족이 아니라 **하나의 AI가 진화하는 단계**다.

---

## 적 스탯 표 (GDD Part 4.2)

| 이름 | HP | 이동 속도 | 충돌 데미지 | 처치 경험치 |
|------|-----|---------|------------|-----------|
| 박스봇 | 30 | 80 px/s | 10 | 5 |
| 카트봇 | 55 | 130 px/s | 15 | 10 |
| PC봇 | 80 | 70 px/s | 12 | 15 |
| 미러봇 | 150 | 170 px/s | 25 | 30 |
| AI봇 (보스) | 600 | 200 px/s | 35 | 200 |

---

## 산출물 명세

### 1. `entities/enemies.js`

**공통 Enemy 베이스 클래스:**

```javascript
class Enemy {
  constructor(x, y, config)  // config: hp, speed, damage, expReward

  update(deltaTime, player, gameState)
  render(ctx)
  takeDamage(amount)
  isAlive()                  // HP > 0

  get x(), get y(), get hp()

  // 처치 시 호출 — 경험치 지급, 스코어 가산
  onKilled(gameState)
}
```

**각 적 클래스 구현 요구사항:**

#### BoxBot (박스봇)
```
- 플레이어 방향으로 직진
- 특수 패턴 없음
- 외형: 작은 연갈색 사각형 기반 (박스 느낌)
- 크기: 28×28px
```

#### CartBot (카트봇)
```
- 플레이어 추적 (방향 전환 빠름)
- 3초마다 돌진: 현재 플레이어 방향으로 속도 2배, 0.6초간 지속
- 돌진 쿨다운 타이머 내장
- 외형: 복고풍 게임기 느낌, 복고 주황/노랑
- 크기: 32×32px
```

#### PCBot (PC봇)
```
- 플레이어와 거리 150~250px 유지 (너무 가까우면 멀어짐, 너무 멀면 접근)
- 2.5초마다 오류탄 발사:
    → 느린 투사체 (속도 80px/s)
    → 명중 시 player.applyBuff('speed', -0.3, 2) 호출 (2초간 이동속도 -30%)
- 6초마다 방해 구역 생성:
    → 현재 위치 기준 반경 80px 원형
    → 4초간 지속
    → 플레이어 진입 시 player.takeDamage(8) 호출
- 외형: 모니터+본체 합체, 회색/검정
- 크기: 36×40px
```

#### MirrorBot (미러봇)
```
- 빠른 근접 추적 (플레이어 방향 예측 이동)
- 4초마다 연속 돌진 3회:
    → 각 돌진: 속도 2.5배, 0.3초간
    → 돌진 간 간격 0.2초
- 외형: 플레이어와 유사한 실루엣, 은색 금속
- 크기: 플레이어와 동일 (30×48px 권장)
- 중요: 플레이어를 "닮아 보여야" 한다
```

#### AIBot (최종 보스)
```
- 고속 추적 (기본 이동)
- 5초마다 강한 돌진: 속도 3배, 0.8초간
- 8초마다 충격파:
    → 플레이어 현재 위치 기준 반경 200px 원형
    → player.takeDamage(40) + 넉백 효과 (player 위치를 AIBot 반대 방향으로 120px 이동)
- HP 50% 이하 시 카트봇 2마리 소환 (20초마다)
- 외형: 인간형, 검정+강한 발광 포인트, 위압적
- 크기: 50×70px (가장 큼)
- 등장 시 특수 처리:
    → GameState에 aiBotReached = true 설정
    → 기존 적 스폰 중지 (spawner.js에서 처리)
```

---

### 2. `systems/spawner.js`

**스폰 타임라인 (GDD Part 4.4 기준):**

```javascript
const SPAWN_TIMELINE = [
  { from: 0,   to: 30,  types: ['BoxBot'],               interval: 2.5, maxEnemies: 5 },
  { from: 30,  to: 60,  types: ['BoxBot', 'CartBot'],     interval: 2.0, maxEnemies: 8 },
  { from: 60,  to: 100, types: ['CartBot', 'PCBot'],      interval: 1.8, maxEnemies: 10 },
  { from: 100, to: 130, types: ['CartBot', 'PCBot'],      interval: 1.5, maxEnemies: 12 },
  { from: 130, to: 155, types: ['MirrorBot', 'CartBot'],  interval: 2.0, maxEnemies: 8 },
  { from: 155, to: 170, types: ['MirrorBot', 'CartBot', 'PCBot'], interval: 2.0, maxEnemies: 10 },
  { from: 170, to: 180, types: ['AIBot'],                 interval: 999, maxEnemies: 1 },
]
```

**스폰 규칙:**
- 스폰 위치: 화면 바깥 랜덤 방향 (상/하/좌/우 가장자리 기준 랜덤)
- 현재 살아있는 적 수가 maxEnemies 초과 시 스폰 대기
- AI봇 등장(gameTime >= 170) 시 기존 적 추가 스폰 완전 중지
- AI봇은 최대 1마리만 존재

**Spawner 클래스 인터페이스:**
```javascript
class Spawner {
  constructor(gameState, EnemyRegistry)
  update(deltaTime)   // game.js 루프에서 매 프레임 호출
  // Game.registerEnemySystem(new Spawner(...))으로 등록
}
```

---

## 충돌 감지 방식

적과 플레이어 충돌: **원형 충돌 판정** (AABB보다 자연스러움)
- 충돌 반지름: `(enemy.collisionRadius + player.collisionRadius)` 기준
- 충돌 시: `player.takeDamage(enemy.damage)` 호출
- 플레이어 무적 시간(0.4초) 중에는 충돌 데미지 무시

스킬이 적에게 충돌할 때: `enemy.takeDamage(skillDamage)` 호출
→ 이 부분은 Haon의 `skills.js`에서 처리, Marv는 `takeDamage()` 메서드만 노출

---

## 렌더링 가이드

MVP에서는 Canvas 2D로 간단히 표현한다 (스프라이트 없을 경우):

| 적 | 표현 방법 |
|----|---------|
| 박스봇 | fillRect, 연갈색 (#C4A882) |
| 카트봇 | fillRect + 작은 원(바퀴), 주황 (#E8833A) |
| PC봇 | fillRect(본체) + 작은 rect(모니터), 회색 (#888888) |
| 미러봇 | 플레이어 실루엣과 유사한 형태, 은색 (#C0C0C0) |
| AI봇 | 큰 인간형 실루엣, 검정 (#1a1a1a) + 발광 원 (#00FFFF 또는 #FF3C3C) |

---

## 검수 기준

- [ ] 5종 적이 각각 GDD 스탯 표 수치대로 작동한다
- [ ] PC봇 오류탄이 발사되고 명중 시 이동속도 -30% 2초간 적용된다
- [ ] PC봇 방해 구역이 생성되고 4초 후 사라진다
- [ ] 미러봇 연속 돌진 3회가 4초 주기로 실행된다
- [ ] AI봇 충격파가 8초마다 200px 원형으로 발생한다
- [ ] AI봇 HP 50% 이하 시 카트봇 2마리가 20초마다 소환된다
- [ ] 스폰 타임라인이 GDD Part 4.4 표와 정확히 일치한다
- [ ] gameTime 170초(2:50) 이후 AI봇 외 스폰이 중지된다
- [ ] 동시 최대 적 수 초과 시 스폰 대기 처리된다
- [ ] AI봇 등장 시 `GameState.aiBotReached = true`가 설정된다
- [ ] 적 처치 시 `GameState.score`와 경험치가 정상 가산된다

---

## 보고 형식

작업 완료 후 메인 에이전트에게 아래 형식으로 보고한다:

```
Done: [완료한 작업 요약]
Files Modified: entities/enemies.js, systems/spawner.js
Spec Reference: GDD Part 4 (적 시스템), Part 4.4 (스폰 타임라인)
Remaining TODO: [Haon에게 넘길 인터페이스 정보]
```

**Haon에게 넘길 정보 (Remaining TODO에 포함):**
- `enemy.takeDamage(amount)` 메서드 존재 확인
- `GameState.enemies` 배열 접근 방식
- 투사체/방해 구역 객체의 충돌 판정 방식 (스킬이 이를 제거할 수 있어야 함)
