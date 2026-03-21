# Dev Survival — Project Index

> 모든 작업은 이 파일을 먼저 읽고 관련 문서를 최대 3개 선택한다.
> 최종 업데이트: 2026-03-21

---

## 파일 구조 & 담당 에이전트

### 소스 코드

| 파일 | 상태 | 담당 에이전트 | 관련 GDD |
|------|------|------------|---------|
| `index.html` | ✅ 완료 | Raf | Part 9 |
| `game.js` | ✅ 완료 | Raf | Part 2, 3 |
| `entities/player.js` | ✅ 완료 | Raf | Part 3 |
| `entities/enemies.js` | 🔶 BoxBot만 | Marv | Part 4 |
| `entities/skills.js` | 🔶 2종만 | Haon | Part 5 |
| `systems/spawner.js` | 🔶 BoxBot만 | Marv | Part 4.4 |
| `systems/levelup.js` | ✅ 완료 | Haon | Part 5.1 |
| `systems/score.js` | ✅ 완료 | Mason | Part 6.1 |
| `systems/meta.js` | ❌ 미구현 | Mason | Part 6.4 |
| `ui/hud.js` | ✅ 완료 | Mason | Part 7 |
| `ui/lobby.js` | ✅ 완료 | Mason | Part 7 |
| `ui/result.js` | ✅ 완료 | Mason | Part 7 |

### 에이전트 컨텍스트

| 파일 | 에이전트 | 역할 |
|------|---------|------|
| `agents/main-agent.md` | Integration Lead | 전체 조율, 작업 지시 |
| `agents/raf.md` | Raf | Core System Designer |
| `agents/marv.md` | Marv | Enemy & Combat Designer |
| `agents/haon.md` | Haon | Skill & Progression Designer |
| `agents/mason.md` | Mason | UI/UX Flow Designer |
| `agents/milli.md` | Milli | GDD Editor |
| `agents/fleeky.md` | Fleeky | AI Experiment Logger |

### 문서

| 파일 | 내용 |
|------|------|
| `GDD.md` | Game Design Document v0.4 (설계 원본) |
| `progress.md` | 마일스톤별 진행 현황 |
| `experiment_log.md` | AI 협업 실험 로그 |
| `PROJECT_INDEX.md` | 이 파일 |

---

## GDD Part 맵

| Part | 내용 | 관련 에이전트 |
|------|------|------------|
| Part 1 | 게임 비전 & 개요 | — |
| Part 2 | 코어 루프 & 게임플레이 | Raf |
| Part 3 | 플레이어 시스템 (스탯, 이동, 피격) | Raf |
| Part 4 | 적 시스템 (5종 스탯, 패턴, 스폰 타임라인) | Marv |
| Part 5 | 스킬 & 판 내 성장 (8종 스킬, 레벨업) | Haon |
| Part 6 | 경제 & 메타 성장 (스코어, 출시 포인트, 업그레이드) | Mason |
| Part 7 | UI/UX 설계 (HUD, 로비, 결과, 업그레이드 화면) | Mason |
| Part 8 | 아트 & 연출 | — |
| Part 9 | 기술 명세 & 개발 계획 | Raf |
| Part 10 | Agent Collaboration Architecture | main-agent |

---

## 마일스톤 현황

| 마일스톤 | 내용 | 상태 |
|---------|------|------|
| M1~M2 | 기반 구조 + BoxBot + 스킬 2종 + 기본 UI | ✅ 완료 |
| M3 | 적 5종 전체 + 스폰 타임라인 확장 | 🔶 진행 중 |
| M4 | 스킬 8종 전체 확장 | ❌ 대기 |
| M5 | 경제 시스템 (출시 포인트, 메타 업그레이드) | ❌ 대기 |
| M6 | UI 완성 (업그레이드 화면, 연출 추가) | ❌ 대기 |
| M7 | 폴리싱 (스프라이트, 사운드, 밸런스) | ❌ 대기 |

---

## 작업 선택 가이드

| 하려는 작업 | 읽어야 할 문서 (최대 3개) |
|-----------|----------------------|
| 적 추가/수정 | `agents/marv.md`, `GDD.md` Part 4, `entities/enemies.js` |
| 스킬 추가/수정 | `agents/haon.md`, `GDD.md` Part 5, `entities/skills.js` |
| UI 수정 | `agents/mason.md`, `GDD.md` Part 7, 해당 ui/*.js |
| 경제 시스템 | `agents/mason.md`, `GDD.md` Part 6, `systems/meta.js` |
| GDD 수치 충돌 | `agents/milli.md`, `GDD.md` 해당 Part, 충돌 발생 파일 |
| 스폰 타임라인 수정 | `agents/marv.md`, `GDD.md` Part 4.4, `systems/spawner.js` |
