# Pipeline Lessons — DevSurvivor
> 자동 누적 지식 베이스. validate.js와 PostCompact agent가 함께 관리.
> 포맷: Pattern / Root Cause / Grep / Detected

---

## Lesson #001
**Pattern**: Game.gameOver() 호출 후 return 없이 로직 계속 실행
**Root Cause**: gameOver()는 GameState를 변경할 뿐 실행을 멈추지 않음. 이후 코드가 계속 돌아 이중 gameOver, 적 업데이트 등 사이드이펙트 발생.
**Fix**: `Game.gameOver(win); return` 패턴 강제
**Grep**: `Game\.gameOver\([^)]*\)[^;]*\n[^}]*[^r][^e][^t][^u][^r][^n]`
**Detected**: 2025-03 (game.js 루프)

---

## Lesson #002
**Pattern**: Game.start()에서 GameState 필드 리셋 누락 (aiBotSpawned, spawnTimer 등)
**Root Cause**: Object.assign으로 GameState를 리셋할 때 enemySystem의 내부 상태는 별도로 초기화해야 함. Game.start() 내에서 `spawner.spawnTimer = 0`, `spawner.aiBotSpawned = false` 직접 리셋 필요.
**Fix**: enemySystem 리셋 블록을 Game.start() 안에 명시
**Grep**: `aiBotSpawned`
**Detected**: 2025-03 (spawner 버그)

---

## Lesson #003
**Pattern**: 새 JS 파일 생성 후 bundle.js SCRIPTS 배열에 미포함
**Root Cause**: bundle.js는 SCRIPTS 배열을 수동으로 관리함. 새 파일 추가 시 자동 반영 안됨 → docs/index.html 빌드에서 누락.
**Fix**: entities/systems/ui 파일 생성 시 bundle.js SCRIPTS에 즉시 추가
**Grep**: (validate.js가 파일시스템으로 직접 체크)
**Detected**: 2025-03 (charsprites.js 누락)

---

## Lesson #004
**Pattern**: ctx.save() 와 ctx.restore() 개수 불일치
**Root Cause**: 조건 분기 안에서 early return 할 때 ctx.restore() 누락. 렌더 상태(globalAlpha, transform 등)가 누적되어 다음 프레임 오염.
**Fix**: ctx.save() 직후 try-finally 패턴 또는 명시적 restore 확인
**Grep**: (validate.js가 카운트로 체크)
**Detected**: 2025-03 (player.js sprite path early return)

---

## Lesson #005
**Pattern**: 에셋 경로 하드코딩 후 폴더 재구성 시 경로 깨짐
**Root Cause**: assets/ 하위 구조를 재정리할 때 코드 내 경로 참조를 함께 업데이트하지 않으면 silent fail (canvas fallback으로 스프라이트 미표시).
**Fix**: 에셋 이동 시 grep으로 참조 전수 확인, charsprites.js를 단일 진실 소스로 유지
**Grep**: `assets/Modern tiles_Free`
**Detected**: 2025-03 (폴더 재구성 후 charsprites.js 경로 업데이트)

---

## Lesson #006
**Pattern**: 게임 시작 시 플레이어에게 스킬이 없어 공격 불가
**Root Cause**: MetaManager.applyToPlayer() 이후 스킬이 없을 경우 기본 스킬 지급 로직이 없었음. 신규 플레이어나 메타 업그레이드 미완료 상태에서 재현.
**Fix**: Game.start()에서 skillManager.slots.some(Boolean) 체크 후 없으면 '디버그' 기본 지급
**Grep**: `skillManager\.slots\.some`
**Detected**: 2025-03 (game.js onboarding 버그)

---

## Lesson #007
**Pattern**: result.js에서 win/lose 버튼 좌표가 동일한 변수 사용 → 잘못된 버튼 활성화
**Root Cause**: _winRestartRect / _loseRestartRect를 구분하지 않고 단일 rect로 처리하면 승리/패배 화면에서 좌표가 달라도 동일 변수 참조.
**Fix**: win/lose 각각 별도 rect 4개 선언
**Grep**: `_winRestartRect\|_loseRestartRect`
**Detected**: 2025-03 (result.js 리팩터)

---
<!-- 이후 항목은 validate.js autoLearn 또는 PostCompact agent가 자동 추가 -->

## Lesson #008
**Pattern**: bundle.js SCRIPTS에 'systems/drops.js' 없음 → docs/index.html 미반영
**Root Cause**: (자동 감지 — 다음 세션에서 원인 분석 필요)
**Fix**: (미정)
**Grep**: `BUNDLE_MISSING`
**Detected**: 2026-03-21 (systems/drops.js)
