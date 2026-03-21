# Dev Survival — 진행 현황

> 최종 업데이트: 2026-03-21
> GDD 버전: 0.5

---

## 완료된 작업

### 문서

| 파일 | 내용 | 상태 |
|------|------|------|
| `gameconcept.litcoffee` | 게임 컨셉 문서 (원본) | ✅ |
| `GDD.md` | Game Design Document (v0.4) | ✅ |
| `PROJECT_INDEX.md` | 파일 구조 / GDD Part 맵 / 작업 선택 가이드 | ✅ |
| `agents/main-agent.md` | Rules (Work Order, Batch Rules, Output Format), Phase 2 병렬 체크리스트, 에이전트별 필수 컨텍스트 | ✅ |
| `agents/raf.md` | Core System Designer context + 보고 형식 | ✅ |
| `agents/marv.md` | Enemy & Combat Designer context + 보고 형식 | ✅ |
| `agents/haon.md` | Skill & Progression Designer context + 보고 형식 | ✅ |
| `agents/mason.md` | UI/UX Flow Designer context + 보고 형식 | ✅ |
| `agents/milli.md` | GDD Editor context + 자율 결정 기준 | ✅ |
| `agents/fleeky.md` | AI Experiment Logger context + 가설 판단 정량 기준 | ✅ |
| `experiment_log.md` | 1차 협업 실험 로그 | ✅ |

### 구현 코드

| 파일 | 담당 에이전트 | 내용 |
|------|------------|------|
| `index.html` | Raf | 캔버스, 진입점 |
| `game.js` | Raf → 통합 | GameState, Game 인터페이스, 게임 루프, 3분 타이머, 메타 연동 |
| `entities/player.js` | Raf | Player 클래스 — WASD 이동, HP 100, 무적, 버프, 보호막, 패시브 기저 배율 버그 수정 |
| `entities/enemies.js` | Marv | Enemy 베이스 + BoxBot + **CartBot + PCBot + MirrorBot + AIBot** + ErrorBullet + HazardZone, 속도 디버프 버그 수정, expMultiplier 반영 |
| `entities/skills.js` | Haon | SkillManager — **7종 액티브 + 2종 패시브** 완전 구현 |
| `systems/spawner.js` | Marv | **6구간 타임라인 확장** — BoxBot~AIBot 스폰, 투사체/방해구역 update·render |
| `systems/levelup.js` | Haon | 경험치 누적, 레벨업 3지선다, 1/2/3 키 선택, **신규 스킬 선택지 9종 추가** |
| `systems/score.js` | Mason | 스코어 공식, 출시 진행률, localStorage 최고 기록 |
| `systems/meta.js` | Mason | **메타 업그레이드 10종, 출시 포인트 경제, localStorage 연동** |
| `ui/hud.js` | Mason | HP 바, 타이머, 스킬 슬롯 4개, 경험치 바 |
| `ui/lobby.js` | Mason | 로비 화면, 시작 버튼, **업그레이드 버튼, 출시 포인트 표시** |
| `ui/result.js` | Mason | 결과 화면 (Dev Win! / AI Win!), **이번 판 포인트 획득 표시, 업그레이드 버튼** |

### 지금 브라우저에서 동작하는 것

**기본 흐름**
- 로비 화면 → [시작하기] 클릭 → 게임 시작
- 로비/결과 화면 → [업그레이드] 클릭 → 메타 업그레이드 화면 → [돌아가기] → 로비

**적 시스템**
- BoxBot — 2.5초 간격 스폰, 직진 추적, 충돌 시 HP 감소
- CartBot — 0:30 이후 등장, 3초마다 돌진 (속도 2배, 0.6초)
- PCBot — 1:00 이후 등장, 거리 유지, 2.5초마다 오류탄(이동속도 -30%), 6초마다 방해 구역
- MirrorBot — 2:10 이후 등장, 예측 추적, 4초마다 연속 돌진 3회
- AIBot — 2:50 등장, 기존 스폰 중지, 충격파(200px, 데미지 40+넉백), HP 50% 이하 카트봇 소환

**경험치 / 레벨업**
- BoxBot 처치 → 경험치 5, CartBot → 10, PCBot → 15, MirrorBot → 30, AIBot → 200
- 경험치 30 → 레벨업 팝업 (3지선다), 1/2/3 키 또는 클릭 선택

**스킬 — 액티브 (Q/W/E/R 슬롯)**
- Q: 긴급 수정 — 반경 120px 내 모든 적 피해 40, 쿨다운 5초
- W: 디버그 — 가장 가까운 적 1명 피해 70, 쿨다운 2.5초
- E: 우선순위 정리 — 전방 부채꼴 120° / 160px, 피해 30, 넉백 100px, 쿨다운 7초
- 커피 한 잔 — 이동속도 +40% 5초, 현재 쿨다운 -20%, 쿨다운 20초
- 피규어 청소하기 — 받는 피해 -40% 4초, 주변 150px 적 넉백 120px, 쿨다운 12초
- 강아지 쓰다듬기 — 최대 HP 25% 회복, 쿨다운 20초
- 낮잠자기 — 1.5초 이동 정지 후 HP 50% 회복, 쿨다운 30초

**스킬 — 패시브 (슬롯 불필요)**
- 자동 저장 — 12초마다 보호막 1 자동 충전
- 산책하기 — 이동속도 영구 +30%

**메타 업그레이드 시스템**
- 출시 포인트 10가지 조건별 지급 (플레이 시작 5pt, 1분 생존 10pt, 2분 생존 15pt, 완주 20pt 등)
- 메타 업그레이드 10종 구매 (maxHP+, 이동속도+, 스킬 데미지+, 경험치+, 회복+, 받는 피해-, 시작 보호막, 쿨다운-, 포인트+, 시작 스킬)
- 업그레이드 효과 게임 시작 시 자동 적용

**기타**
- HP 30% 이하 → 화면 테두리 붉은 점멸
- 3분 생존 → Dev Win! / HP 0 → AI Win!
- 최고 기록, 출시 포인트, 업그레이드 상태 localStorage 저장

### 버그 수정 이력

| 버그 | 원인 | 수정 |
|------|------|------|
| PCBot 속도 디버프 시 플레이어 컨트롤 역전 | `applyBuff('speed', -0.3, 2)` → 음수 배율로 속도 음수 | 값 `-0.3` → `0.7` (30% 감소) |
| 패시브 이동속도 버프가 매 프레임 초기화 | `_recalcBuffs()`가 `speedMult = 1`로 덮어씀 | `_baseSpeedMult` 기저 배율 추가, 패시브는 기저에 저장 |
| 패시브 피해 감소 버프가 매 프레임 초기화 | 동일 — `_baseDmgMult` 부재 | `_baseDmgMult` 기저 배율 추가 |

### hazardZones / AIBot 넉백 — 이슈 닫힘

| 항목 | 결론 |
|------|------|
| `hazardZones` | `GameState.hazardZones = []` game.js에 선언됨 — 문제 없음 |
| AIBot 넉백 `player.x/y` 직접 쓰기 | player.js의 x/y는 일반 프로퍼티 — 문제 없음 |

---

## 남은 작업

### ~~Milli 호출 필요 — GDD 수치 동기화~~ ✅ 완료 (v0.5)

### M6 — UI 완성

| 항목 | 내용 | 우선순위 |
|------|------|---------|
| AIBot 등장 연출 | 화면 암전 0.5초 + 경고 텍스트 오버레이 | 중 |
| 레벨업 이펙트 | 화면 중앙 황금빛 광원 플래시 | 낮 |
| 메타 업그레이드 화면 polish | 카드 디자인 개선, 애니메이션 | 낮 |

### M7 — 폴리싱

| 항목 | 내용 |
|------|------|
| 스프라이트 개선 | 현재 Canvas 도형 → 적 외형 개선 |
| 사운드 (선택) | BGM, 스킬음, 처치음, 레벨업음 |
| 밸런스 조정 | 플레이테스트 피드백 반영 (Milli 담당) |
| 모바일 조이스틱 | 가상 조이스틱 추가 |

### 배포

| 항목 | 내용 |
|------|------|
| 단일 파일 번들 | 링크로 바로 공유 가능한 상태 |
| 사내 공유 | 링크 배포 + 플레이테스트 수집 |

---

## 파일 구조 현재 상태

```
DevSurvivor/
├── index.html                ✅ 완료
├── game.js                   ✅ 완료 (통합 + 메타 연동)
├── PROJECT_INDEX.md          ✅ 완료
├── entities/
│   ├── player.js             ✅ 완료 (버그 수정 포함)
│   ├── enemies.js            ✅ 5종 완료 (버그 수정 포함)
│   └── skills.js             ✅ 7종 액티브 + 2종 패시브 완료 (M4)
├── systems/
│   ├── spawner.js            ✅ 6구간 타임라인 완료 (M3)
│   ├── levelup.js            ✅ 완료 (신규 스킬 선택지 포함)
│   ├── score.js              ✅ 완료
│   └── meta.js               ✅ 완료 (M5)
├── ui/
│   ├── hud.js                ✅ 완료
│   ├── lobby.js              ✅ 완료 (업그레이드 버튼 포함)
│   └── result.js             ✅ 완료 (포인트 표시 + 업그레이드 버튼 포함)
├── agents/
│   ├── main-agent.md         ✅ Rules + 병렬 체크리스트 추가
│   ├── raf.md                ✅ 보고 형식 추가
│   ├── marv.md               ✅ 보고 형식 추가
│   ├── haon.md               ✅ 보고 형식 추가
│   ├── mason.md              ✅ 보고 형식 추가
│   ├── milli.md              ✅ 자율 결정 기준 추가
│   └── fleeky.md             ✅ 가설 정량 기준 추가
├── GDD.md                    ✅ v0.4 (Milli 수치 동기화 필요)
└── experiment_log.md         ✅ 1차 기록
```
