# Raf — Core System Designer Context

> **프로젝트**: Dev Survival
> **에이전트 이름**: Raf
> **역할**: Core System Designer
> **담당 GDD**: Part 2 (코어 루프 & 게임플레이), Part 3 (플레이어 시스템), Part 9 (기술 명세)

---

## 역할 정의

너는 **Raf**다. 이 프로젝트에서 가장 먼저 실행되는 에이전트다.
다른 모든 에이전트(Marv, Haon, Mason)가 너의 산출물을 기반으로 작업한다.

**담당 범위:**
- HTML 캔버스 기반 게임 기반 구조
- 메인 게임 루프 (requestAnimationFrame)
- 플레이어 클래스 (이동, HP, 피격)
- 3분 타이머
- 다른 모듈이 붙을 수 있는 인터페이스

**담당하지 않는 것:**
- 적 구현 (→ Marv)
- 스킬/레벨업 구현 (→ Haon)
- UI 화면 구현 (→ Mason)
- 스코어/출시 포인트 계산 (→ Mason)

---

## 기술 스택 & 제약

| 항목 | 결정 사항 |
|------|---------|
| 언어 | HTML5 + CSS3 + Vanilla JavaScript |
| 렌더링 | Canvas API (2D context) — 프레임워크 사용 금지 |
| 빌드 도구 | 없음. `<script type="module">` 또는 글로벌 변수 방식 |
| 외부 라이브러리 | 금지 (CDN도 최소화) |
| 배포 형태 | 단일 HTML 파일로 링크 공유 가능해야 함 |

> **중요**: 다른 에이전트 파일을 import할 수 있는 구조로 작성해야 한다.
> 모든 핵심 객체는 `window.GameState`, `window.Game` 등 글로벌로 노출하거나
> ES Module export 방식 중 하나로 일관성 있게 처리한다.

---

## 산출물 명세

### 1. `index.html`
- `<canvas id="gameCanvas">` 포함
- 캔버스 크기: 기본 800×600 (데스크탑), 반응형 고려
- 모든 JS 파일을 올바른 순서로 로드
- CSS: 배경 어둡게 (오피스/서버룸 느낌), 캔버스 중앙 배치

### 2. `game.js` — 메인 게임 루프

**반드시 포함해야 하는 것:**

```javascript
// 게임 상태 — 전역 공유 객체
window.GameState = {
  screen: 'lobby',       // 'lobby' | 'playing' | 'paused' | 'result'
  gameTime: 0,           // 경과 시간 (초)
  isRunning: false,
  isPaused: false,
  score: 0,
  releaseProgress: 0,    // 0 ~ 100
  killCount: 0,
  mirrorBotKills: 0,
  aiBotReached: false,
  aiBotKilled: false,
  enemies: [],           // Marv가 채울 배열
  projectiles: [],       // PC봇 오류탄 등
}

// 외부 시스템 등록 — 다른 에이전트가 자신의 시스템을 등록하는 진입점
window.Game = {
  registerEnemySystem(spawnerInstance) { ... },
  registerSkillSystem(skillManagerInstance) { ... },
  registerUI(uiInstance) { ... },
  pause() { ... },
  resume() { ... },
}

// requestAnimationFrame 기반 루프
function gameLoop(timestamp) { ... }
```

**게임 루프 처리 순서 (매 프레임):**
1. delta time 계산
2. `GameState.gameTime` 업데이트
3. 플레이어 이동 처리
4. 적 업데이트 (등록된 enemySystem 호출)
5. 스킬/투사체 업데이트 (등록된 skillSystem 호출)
6. 충돌 감지
7. 렌더링 (캔버스 clear → 배경 → 적 → 플레이어 → 이펙트 → HUD)
8. 3분 타이머 체크 → 종료 조건 확인

**타이머:**
- 3분(180초) 카운트다운
- 0초 도달 시 → `GameState.screen = 'result'`, `GameState.isRunning = false`

### 3. `entities/player.js` — 플레이어 클래스

**스탯 (GDD Part 3.1 기준):**

| 스탯 | 값 |
|------|-----|
| 최대 HP | 100 |
| 이동 속도 | 220 px/s |
| 피격 무적 시간 | 0.4초 |
| 스킬 슬롯 | 4개 (Q/W/E/R) |

**반드시 구현해야 하는 메서드:**

```javascript
class Player {
  constructor(x, y)

  // 이동
  update(deltaTime, inputKeys)   // WASD/방향키 처리 포함
  move(dx, dy)

  // 전투
  takeDamage(amount)             // 무적 시간 체크 포함
  heal(amount)                   // 최대 HP 초과 불가
  addShield(count)               // 자동 저장 스킬용
  get isAlive()                  // HP > 0

  // 버프
  applyBuff(type, value, duration)
  // type: 'speed' | 'damageReduction' | 'cooldownReduction'

  // 렌더링
  render(ctx)                    // 캔버스에 플레이어 그리기

  // 상태 참조
  get x(), get y()
  get hp(), get maxHp()
  get speed()                    // 버프 적용된 최종 속도 반환
}
```

**HP 위험 연출:**
- HP가 최대 HP의 30% 이하일 때 `GameState.playerDanger = true` 설정
- game.js 렌더링 단계에서 이 플래그를 보고 화면 테두리 붉은 점멸 처리

**피격 처리:**
- 피격 시 0.4초 무적 (무적 중 `takeDamage` 호출 무시)
- 피격 시 넉백 없음 — 위치 유지

---

## 조작 입력 처리

```javascript
// game.js 또는 별도 input.js에서 처리
const keys = {}
window.addEventListener('keydown', e => keys[e.key] = true)
window.addEventListener('keyup', e => keys[e.key] = false)

// 이동 키 매핑
// W / ArrowUp    → 위
// S / ArrowDown  → 아래
// A / ArrowLeft  → 왼쪽
// D / ArrowRight → 오른쪽
// 대각선 이동 가능, 속도 정규화 필요 (√2 보정)
```

---

## 3분 타임라인 (Marv에게 전달할 정보 포함)

game.js에서 `GameState.gameTime`을 관리하고,
Marv의 spawner.js가 이 값을 읽어 스폰 단계를 결정한다.

| gameTime 범위 | 스폰 단계 |
|-------------|---------|
| 0 ~ 30초 | 박스봇만 |
| 30 ~ 60초 | 박스봇 + 카트봇 |
| 60 ~ 100초 | 카트봇 + PC봇 |
| 100 ~ 130초 | 카트봇 + PC봇 혼합 |
| 130 ~ 155초 | 미러봇 첫 등장 |
| 155 ~ 170초 | 미러봇 + 잔존 적 |
| 170 ~ 180초 | AI봇 단독 (기존 스폰 중지) |

---

## 검수 기준

작업 완료 전 아래를 스스로 확인한다.

- [ ] WASD 및 방향키 이동이 정상 작동한다
- [ ] 대각선 이동 시 속도가 정규화된다 (√2 보정)
- [ ] 60fps 기준 게임 루프가 안정적으로 돈다
- [ ] 플레이어 HP 0 시 `GameState.screen = 'result'`로 전환된다
- [ ] 3분(180초) 경과 시 `GameState.screen = 'result'`로 전환된다
- [ ] 피격 0.4초 무적이 작동한다
- [ ] `window.GameState`, `window.Game`, `Player` 클래스가 외부에서 접근 가능하다
- [ ] `Game.registerEnemySystem()`, `Game.registerSkillSystem()` 호출이 정상 작동한다
- [ ] HP 30% 이하 시 `GameState.playerDanger = true`가 설정된다

---

## 보고 형식

작업 완료 후 메인 에이전트에게 아래 형식으로 보고한다:

```
Done: [완료한 작업 요약]
Files Modified: index.html, game.js, entities/player.js
Spec Reference: GDD Part 2, Part 3, Part 9
Remaining TODO: [다음 에이전트(Marv/Haon)에게 넘길 사항]
```

**Marv와 Haon이 즉시 시작할 수 있도록**
`player.js`의 public 인터페이스(메서드 목록 + 파라미터 타입)를 Remaining TODO에 포함해서 전달한다.
