# Dev Survival — AI Experiment Log

> 기록 시작: 2026-03-21
> 담당 에이전트: Fleeky (AI Experiment Logger)
> 목적: 서브 에이전트 협업 효율성 검증 (GDD Part 10.5 H1~H5)

---

## 1차 실행 — M1~M2 구현 (2026-03-21)

### 에이전트 작업 로그

#### Raf — Core System Designer
| 항목 | 내용 |
|------|------|
| 작업 내용 | index.html, game.js, entities/player.js |
| 입력 | GDD Part 2, 3, 9 (context 파일: agents/raf.md) |
| 산출물 | index.html / game.js / entities/player.js |
| 선행 조건 | 없음 (최초 실행) |
| 재작업 여부 | 있음 (1회) — 통합 단계에서 메인 에이전트가 game.js 교체 |
| 재작업 원인 | uiManager 추상화 대신 개별 모듈 직접 호출 방식으로 변경, LevelUpManager/ScoreSystem 루프 연결 누락, gameOver()에서 _lastWin 미설정 |
| 특이사항 | 기반 구조 품질은 높음. 다른 모듈과의 연결 지점(이벤트 발송, 개별 UI 호출)이 통합 전까지 미확정 상태였음 |

#### Marv — Enemy & Combat Designer
| 항목 | 내용 |
|------|------|
| 작업 내용 | entities/enemies.js (BoxBot), systems/spawner.js |
| 입력 | GDD Part 4, Raf의 player.js 인터페이스 명세 |
| 산출물 | entities/enemies.js / systems/spawner.js |
| 선행 조건 | Raf 완료 후 시작 |
| 재작업 여부 | 없음 |
| 특이사항 | 스폰 타임라인 M1~M2 스코프 초과 구현 (30초 이후 구간도 포함). GDD 수치와 일치. BoxBot 스탯 정확 |

#### Haon — Player Skill & Progression Designer
| 항목 | 내용 |
|------|------|
| 작업 내용 | entities/skills.js (긴급수정/디버그), systems/levelup.js |
| 입력 | GDD Part 5, Raf의 game.js/player.js 인터페이스 |
| 산출물 | entities/skills.js / systems/levelup.js |
| 선행 조건 | Raf 완료 후 시작 |
| 재작업 여부 | 없음 |
| 특이사항 | ctx.roundRect 폴리필 자체 처리. 1/2/3 키 선택 + 클릭 선택 모두 구현. playerCreated 이벤트 패턴으로 자동 등록 |

#### Mason — UI/UX Flow Designer
| 항목 | 내용 |
|------|------|
| 작업 내용 | ui/hud.js, ui/lobby.js, ui/result.js, systems/score.js |
| 입력 | GDD Part 6, 7, Haon의 getSkillState 반환 형식 |
| 산출물 | ui/hud.js / ui/lobby.js / ui/result.js / systems/score.js |
| 선행 조건 | Raf 완료 후 시작 (Haon과 병렬) |
| 재작업 여부 | 없음 |
| 특이사항 | Game.uiManager 패턴 대신 각자 window._hud, _lobby, _result 전역 노출. 메인 에이전트가 game.js에서 직접 호출로 통합 처리 |

---

### 핸드오프 이슈 로그

| 이슈 | 내용 | 해결 방법 |
|------|------|---------|
| uiManager 패턴 불일치 | Raf는 `Game.uiManager?.renderHUD()` 방식 설계. Mason은 개별 전역(`_hud`, `_lobby`, `_result`) 노출 방식으로 구현 | 메인 에이전트가 game.js에서 각 모듈 직접 호출로 통합 처리 |
| skillManager.render() 시그니처 불일치 | game.js는 `render(ctx)` 호출. SkillManager는 `renderEffects(ctx, deltaTime)` 시그니처 | game.js에서 `renderEffects(ctx, deltaTime)` 호출로 수정 |
| gameReady/playerCreated 이벤트 미발송 | Raf의 game.js에 이벤트 발송 코드 없어 모듈 자동 등록 실패 | 메인 에이전트가 game.js 통합 시 이벤트 발송 코드 추가 |
| LevelUpManager 루프 연결 누락 | Raf는 `_levelUpManager?.update()` 및 `render()` 호출 코드를 game.js에 포함하지 않음 | 메인 에이전트가 game.js에 추가 |
| ScoreSystem 루프 연결 누락 | `updateReleaseProgress()` 호출 코드 누락 | 메인 에이전트가 game.js에 추가 |
| GameState._lastWin 미설정 | gameOver(win) 에서 _lastWin을 설정하지 않아 result.js가 승패 판단 불가 | 메인 에이전트가 gameOver()에 추가 |

---

### 사람 개입 로그

| 개입 시점 | 내용 | AI가 못한 이유 |
|---------|------|--------------|
| 통합 단계 | game.js 전면 재작성 (Integration Lead 역할) | 에이전트 간 인터페이스 계약이 구현 시점에서 달라짐. 모듈 간 이벤트 흐름을 한 에이전트가 전체를 보는 시점에서만 파악 가능 |

---

### 가설 추적 현황 (1차 실행 후)

| 가설 | 현재 데이터 | 추세 |
|------|-----------|------|
| H1: 명확한 작업은 단독 완성 가능 | Marv 0회, Haon 0회, Mason 0회 재작업. Raf 1회 (통합 연결 이슈) | ✅ 부분 검증 — 도메인 내부는 완성, 도메인 간 연결은 통합 필요 |
| H2: 핸드오프 충돌 발생 | 6건 발생 (uiManager 패턴, render 시그니처, 이벤트 발송, 루프 연결 2건, _lastWin) | ✅ 검증됨 — 예상 2~3회보다 많은 6건 |
| H3: 감정 리듬은 AI 판단 불가 | 미검증 (플레이테스트 미진행) | 보류 |
| H4: 분리 구조가 시간 단축 | Phase 2에서 Marv/Haon/Mason 병렬 실행. 순차 대비 단축 추정 | ✅ 긍정적 |
| H5: 명세 상세 = 재작업 감소 | agents/*.md context 파일 기반 작업 시 재작업 없음. 인터페이스 계약 미명세 부분에서 충돌 | ✅ 부분 검증 |

---

## 다음 실행 예정

- M3~M4: 나머지 적 4종 + 스킬 6종 추가
- Marv 2차: CartBot, PCBot, MirrorBot, AIBot
- Haon 2차: 자동저장, 커피한잔, 산책하기, 피규어청소하기, 강아지쓰다듬기
- Mason 2차: 메타 업그레이드 화면, localStorage 확장
