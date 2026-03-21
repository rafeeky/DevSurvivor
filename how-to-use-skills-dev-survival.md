# How to Use Skills for Dev Survival
부제: **Claude Code Skills 운영 가이드 — GDD, Subagents, Verification 중심**

> 대상 프로젝트: **Dev Survival**  
> 기준 문서: `Dev Survival — Game Design Document v0.2`  
> 목적: Claude Code에서 Skills를 **실제 제작 프로세스에 맞게** 운영하기 위한 팀/개인용 가이드

---

## 1. 이 문서의 목적

이 문서는 일반적인 Claude Skills 사용 팁을 그대로 복사한 문서가 아니다.  
**Dev Survival** 프로젝트의 개발 방식, GDD 구조, Subagent 운영 실험에 맞춰 아래를 정리한 문서다.

- 이 프로젝트에서 어떤 종류의 Skills가 필요한지
- 각 Skill을 어떤 단위로 쪼개서 만들면 좋은지
- GDD와 연결해서 Skill을 어떻게 호출해야 하는지
- Subagent 구조와 Skill 구조를 어떻게 맞물리게 할지
- 반복 실행 시 흔히 생기는 실패와 보완 포인트
- 이후 사내 공유/재사용 가능한 형태로 어떻게 정리할지

이 프로젝트에서 Skills는 단순한 “편의 도구”가 아니라,  
**GDD 기반 역할 분리 + 제작 자동화 + 실험 로그 축적**을 위한 운영 단위로 본다.

---

## 2. Dev Survival에서 Skills를 쓰는 이유

Dev Survival은 단순히 웹 게임 프로토타입을 하나 만드는 프로젝트가 아니다.  
이 프로젝트는 동시에 다음을 실험한다.

1. **GDD 기반 역할 분리가 실제 제작 속도를 높이는가**
2. **Claude Code + Subagent 구조가 구현 품질을 안정화하는가**
3. **어떤 작업은 Skill로 고정하는 것이 반복 생산에 유리한가**
4. **어디까지 AI에게 맡기고 어디부터 사람이 직접 판단해야 하는가**

즉, 이 프로젝트에서 Skill은 아래 역할을 한다.

- 반복되는 작업을 재현 가능하게 만든다
- 각 에이전트의 출력 형식을 안정화한다
- GDD 해석 편차를 줄인다
- 핸드오프 정보를 일정한 틀로 고정한다
- 이후 비슷한 프로젝트에 재사용 가능한 자산이 된다

---

## 3. Skills를 어떤 기준으로 나눌 것인가

이 프로젝트에서는 “기능별”보다 **작업 성격별**로 Skills를 나누는 것이 좋다.  
Claude Code에서 잘 작동하는 Skills는 대체로 하나의 역할에 집중할 때 강하다. fileciteturn0file0

Dev Survival 기준으로는 아래 6가지 유형이 유효하다.

### A. GDD 해석형 Skills
특정 Part를 읽고 구현 단위로 풀어주는 Skill

예:
- `read-part-2-3-core-loop`
- `read-part-4-enemy-spec`
- `read-part-5-skill-spec`
- `read-part-7-ui-flow`

### B. 구현 보조형 Skills
특정 파일/모듈 구조를 만드는 Skill

예:
- `scaffold-player-loop`
- `scaffold-enemy-system`
- `scaffold-skill-system`
- `scaffold-ui-flow`

### C. 검증형 Skills
코드가 GDD와 맞는지, 플레이 루프가 깨지지 않는지 확인하는 Skill

예:
- `verify-gdd-alignment`
- `verify-3min-run`
- `verify-skill-cooldowns`
- `verify-result-flow`

### D. 핸드오프형 Skills
서브 에이전트 간 전달용 요약을 만드는 Skill

예:
- `handoff-to-marv`
- `handoff-to-haon`
- `handoff-to-mason`

### E. 문서화형 Skills
GDD / 변경 이력 / 실험 로그를 정리하는 Skill

예:
- `update-gdd-from-implementation`
- `write-experiment-log`
- `summarize-ai-insights`

### F. 운영/가드레일형 Skills
범위 초과, 역할 침범, GDD 외 추정 추가를 막는 Skill

예:
- `mvp-scope-guard`
- `role-boundary-check`
- `careful-edit-devsurvival`

---

## 4. 이 프로젝트에 특히 필요한 Skill 카테고리

원문에서 제시한 Skill 유형 중, Dev Survival에 직접적으로 맞는 건 아래 범주다. fileciteturn0file0

### 4.1 Code Scaffolding & Templates
이 프로젝트에 가장 바로 필요하다.

적합한 이유:
- `player.js`, `enemies.js`, `skills.js`, `spawner.js`, `levelup.js`, `hud.js`처럼
  파일 책임이 비교적 명확하다
- GDD 명세를 코드 뼈대로 빠르게 바꾸기 좋다
- 반복 실험에 유리하다

### 4.2 Product Verification
이 프로젝트에서 매우 중요하다.

적합한 이유:
- 3분 루프가 끊기지 않는지 검증해야 한다
- AI봇이 정확히 2:50에만 등장하는지 확인해야 한다
- 스킬 쿨다운, 결과 화면 분기, localStorage 저장 등이 눈으로만 보면 놓치기 쉽다
- 검증 Skill은 한 번 잘 만들면 이후 반복 개발에서 계속 쓸 수 있다

### 4.3 Code Quality & Review
서브 에이전트 협업 구조에서는 품질 검토가 특히 중요하다.

적합한 이유:
- 역할 침범 방지
- GDD 외 기능 추가 방지
- 파일 책임 분리 확인
- 메인 에이전트 통합 전 리뷰 자동화

### 4.4 Business Process & Team Automation
이 프로젝트에서는 “팀 자동화”보다 **개인 워크플로우 자동화**에 가깝다.

적합한 이유:
- GDD 수정 로그 자동 기록
- 실험 로그 정리
- 마일스톤별 상태 업데이트
- 공유용 요약 자동 생성

### 4.5 Runbooks
버그 대응이나 조율 문제에 유용하다.

예:
- “왜 AI봇이 2:50 이전에 나오는지”
- “왜 결과 화면 분기가 틀리는지”
- “왜 Marv와 Haon 산출물이 충돌하는지”

---

## 5. Dev Survival 기준 추천 Skill 세트

아래는 실제로 `.claude/skills` 폴더에 두고 운영하기 좋은 1차 세트다.

### 5.1 GDD 해석 계열
- `read-gdd-core-loop`
- `read-gdd-enemies`
- `read-gdd-skills`
- `read-gdd-economy-ui`
- `read-gdd-agent-architecture`

### 5.2 구현 계열
- `build-player-foundation`
- `build-enemy-wave-system`
- `build-skill-levelup-system`
- `build-hud-lobby-result-ui`
- `build-meta-progression`

### 5.3 검증 계열
- `verify-gdd-vs-code`
- `verify-enemy-timeline`
- `verify-skill-balance-basics`
- `verify-ui-flow`
- `verify-save-load`

### 5.4 핸드오프 계열
- `handoff-module-summary`
- `handoff-integration-ready`
- `handoff-gdd-delta`

### 5.5 실험/로그 계열
- `log-subagent-run`
- `write-ai-insight-summary`
- `compare-single-agent-vs-subagents`

---

## 6. Skill은 “하나의 역할”에 집중시키기

원문에서도 복합적인 Skill보다 **한 역할에 분명히 들어맞는 Skill이 좋다**고 본다. fileciteturn0file0  
Dev Survival에서도 같은 원칙이 중요하다.

### 좋은 예
- `read-gdd-enemies`: Part 4만 읽고 적 시스템 구현 단위로 정리
- `verify-enemy-timeline`: AI봇 등장 시점, 스폰 간격, 적 수 검증
- `handoff-module-summary`: 한 모듈을 다음 에이전트에게 넘길 때 필요한 정보만 정리

### 좋지 않은 예
- `make-dev-survival-game`
- `do-everything-for-prototype`
- `read-gdd-and-build-and-test-and-update-docs`

이런 큰 Skill은 처음엔 편해 보여도,  
나중에 어디서 실패했는지 추적하기 어렵다.

---

## 7. GDD 중심으로 Skill을 호출하기

이 프로젝트에서 가장 중요한 운영 원칙은 아래다.

> **Skill은 항상 “무엇을 할지”보다 “어느 GDD Part를 근거로 할지”를 먼저 고정한다.**

즉, 이렇게 부르는 편이 좋다.

### 좋은 호출 방식
- “Part 4만 기준으로 Marv용 적 시스템 구현 스펙을 만들어”
- “Part 7만 보고 Mason용 UI 상태 전환 표를 만들어”
- “Part 10 기준으로 handoff template을 만들어”

### 덜 좋은 호출 방식
- “적 시스템 만들어줘”
- “UI 좀 짜줘”
- “전체를 보고 구현해줘”

후자는 맥락이 넓어져서,  
AI가 GDD 밖 내용을 섞을 가능성이 커진다.

---

## 8. Skill 폴더는 문서 하나가 아니라 “작은 작업 환경”으로 본다

원문에서 강조하듯, Skill은 단순 markdown이 아니라 **폴더 구조 전체를 활용하는 단위**다. fileciteturn0file0  
Dev Survival에서도 이 관점을 그대로 쓰는 게 좋다.

예를 들면:

```text
.claude/skills/read-gdd-enemies/
├── SKILL.md
├── references/
│   └── part4-enemy-spec.md
├── assets/
│   └── enemy-output-template.md
└── examples/
    └── good-enemy-breakdown.md
```

이렇게 하면 다음이 가능하다.

- `SKILL.md`에는 언제 이 Skill을 써야 하는지
- `references/`에는 발췌한 GDD Part
- `assets/`에는 출력 템플릿
- `examples/`에는 좋은 예시

즉, Skill 자체가 **작업 가이드 + 템플릿 + 예시 + 참조 문서**를 갖는 구조가 된다.

---

## 9. Progressive Disclosure를 프로젝트에 맞게 쓰기

원문에서 말하는 progressive disclosure는,  
모든 정보를 처음부터 한꺼번에 넣지 말고 **필요한 순간에 읽을 수 있게 파일을 나누는 방식**이다. fileciteturn0file0

Dev Survival에서 이 방식은 특히 잘 맞는다.

### 예시
`build-enemy-wave-system` Skill 안에:

- `references/part4-enemy-spec.md`
- `references/part2-timeline.md`
- `assets/spawner-output-template.js`
- `examples/good-spawn-table.md`

를 넣어두면, Claude가 적절한 시점에 필요한 것만 읽을 수 있다.

이 방식의 장점:
- context 낭비가 줄어든다
- 역할 집중도가 높아진다
- 같은 Skill 안에서도 템플릿과 예시를 따로 관리할 수 있다

---

## 10. 가장 중요한 섹션: Gotchas

원문에서도 가장 시그널이 높은 부분은 **Gotchas**라고 본다. fileciteturn0file0  
Dev Survival용 Skills도 이 섹션을 꼭 가져야 한다.

각 Skill에 아래 같은 gotcha를 누적해두는 것이 좋다.

### 공통 Gotchas 예시
- GDD에 없는 기능을 임의 추가하지 말 것
- MVP 범위와 확장안을 섞지 말 것
- 수치와 설명을 따로 쓰지 말고 표 기준으로 맞출 것
- 다음 에이전트가 필요로 하는 인터페이스를 빠뜨리지 말 것
- UI Designer가 게임 로직을 설계하지 말 것
- Enemy Designer가 메타 성장 수치를 건드리지 말 것
- “좋아 보이는 제안”과 “현재 확정안”을 구분할 것

### Skill별 Gotchas 예시
#### `read-gdd-enemies`
- 적 이름은 박스봇 → 카트봇 → PC봇 → 미러봇 → AI봇으로 고정
- AI봇은 최종 보스이며 2:50 이전 등장 금지
- 미러봇은 4단계 인간형 엘리트이며 보스가 아님

#### `build-hud-lobby-result-ui`
- 결과 화면 문구는 승리 `Dev Win!`, 패배 `AI Win!` 고정
- 승리 시 로봇 머리 내려치기 이미지, 패배 시 완성형 AI봇 이미지
- UI 화면 흐름은 로비 → 인게임 → 결과 → 업그레이드/재시작 고정

---

## 11. Don’t State the Obvious — 대신 “프로젝트 특이사항”을 넣기

원문에서 좋은 Skill은 AI가 이미 아는 일반론을 반복하지 않고,  
**기본 습관에서 벗어나게 만드는 정보**를 줘야 한다고 본다. fileciteturn0file0

Dev Survival에 적용하면 아래가 중요하다.

### 굳이 안 써도 되는 것
- JavaScript로 클래스를 만들 수 있다
- Canvas로 렌더링할 수 있다
- HP가 0이면 죽는다

### 꼭 넣어야 하는 것
- 3분 세션 구조
- 2:50 AI봇 등장 고정
- 자동 공격 없음
- 스킬 수동 발동 중심
- GDD Part 기반 역할 분리
- 승/패 연출 톤
- HTML 단일 링크 공유를 염두에 둔 최소 의존성
- Subagent 실험이 결과물만큼 중요하다는 점

즉, Skill은 “보편적 코딩 상식”보다  
**이 프로젝트에서만 중요한 제약과 예외**를 담아야 한다.

---

## 12. Setup 정보는 Skill 밖에서 묻고, 설정 파일로 남기기

원문은 일부 Skill이 실행 전에 설정 정보를 받아야 하며, 이를 파일로 관리하는 패턴을 제안한다. fileciteturn0file0  
Dev Survival에서는 아래와 같은 설정이 생길 수 있다.

예:
- 현재 기준 GDD 파일 경로
- MVP 모드 / 확장 모드 여부
- 모바일 대응 포함 여부
- 단일 파일 빌드 여부
- 테스트용 샘플 이미지 경로
- 로그 저장 위치

이런 정보는 Skill 안에 하드코딩하지 말고, 예를 들어:

```json
{
  "gdd_path": "./docs/GDD.md",
  "mvp_only": true,
  "mobile_ui": false,
  "single_file_build": false,
  "log_path": "./logs"
}
```

처럼 `config.json`으로 두는 것이 좋다.

---

## 13. Description Field는 “요약”이 아니라 “언제 호출할지”를 써야 한다

원문에서 강조하는 포인트 중 하나다. fileciteturn0file0  
Skill description은 설명문이 아니라 **모델이 언제 이 Skill을 써야 하는지 판단하는 힌트**다.

### 좋은 description 예시
#### `read-gdd-enemies`
Use this skill when a task involves enemy stats, enemy patterns, spawn timing, wave pacing, or any implementation based on GDD Part 4.

#### `verify-ui-flow`
Use this skill when a task involves lobby flow, HUD state, result screen branching, upgrade screen navigation, or UI checks against GDD Part 7.

### 좋지 않은 description 예시
- This skill is about enemies.
- This skill helps with UI.
- This is a useful skill for the project.

---

## 14. Skills에 Memory를 둘 것인가

원문은 Skill이 로그나 JSON, DB 형태의 memory를 가질 수 있다고 본다. fileciteturn0file0  
Dev Survival에서는 특히 아래 두 곳에 memory가 유효하다.

### A. Experiment logs
- 어떤 에이전트가 어떤 작업을 했는지
- 몇 번 재작업했는지
- 사람이 어디서 개입했는지

### B. Gotchas history
- 어떤 실수가 반복됐는지
- 어떤 규칙을 추가했더니 품질이 좋아졌는지

예시 파일:
- `experiment_log.md`
- `ai_insights.md`
- `gotchas.log`
- `recent_failures.json`

이런 로그를 쌓아두면,  
다음 번 Skill 실행 때 같은 실수를 줄이기 쉽다.

---

## 15. Scripts를 같이 두면 Skill이 강해진다

원문에서도 Skills에 스크립트를 같이 넣는 것이 강력하다고 본다. fileciteturn0file0  
Dev Survival에서도 매우 유효하다.

예:
- `scripts/check_enemy_timeline.js`
- `scripts/check_gdd_consistency.js`
- `scripts/check_result_branches.js`
- `scripts/print_module_interfaces.js`

이런 스크립트가 있으면 Claude는 매번 검증 로직을 새로 상상하지 않고,  
기존 도구를 조합하는 데 더 집중할 수 있다.

---

## 16. On-Demand Hooks를 어디에 쓸까

원문에서는 항상 켜두면 불편한 가드레일을, 필요할 때만 켜는 hooks가 유용하다고 본다. fileciteturn0file0  
Dev Survival에서는 아래 상황에 유용하다.

### 예시
#### `/mvp-freeze`
- MVP 범위를 넘는 기능 추가 차단
- Part 9.3 MVP 포함 목록 밖 기능 수정 시 경고

#### `/gdd-lock`
- GDD에 없는 수치 변경 시 경고
- 수치 변경 전에 Milli 업데이트 요청

#### `/safe-integration`
- 메인 에이전트 승인 전 모듈 병합 차단

이런 hook는 늘 켜둘 필요는 없지만,  
통합 직전이나 문서 동기화 단계에서는 유용하다.

---

## 17. Dev Survival용 Skill 배포 방식

원문은 repo 내 skills 체크인 또는 플러그인/마켓플레이스 방식 두 가지를 말한다. fileciteturn0file0  
지금 프로젝트 규모에서는 **repo 내부 `.claude/skills` 관리**가 더 적합하다.

### 이유
- 프로젝트 전용 규칙이 많다
- GDD와 강하게 결합된다
- 개인 실험/프로토타입 단계다
- marketplace 수준의 일반화는 아직 이르다

추천 구조:

```text
DevSurvivor/
├── .claude/
│   └── skills/
│       ├── read-gdd-enemies/
│       ├── build-enemy-wave-system/
│       ├── verify-gdd-vs-code/
│       ├── handoff-module-summary/
│       └── write-ai-insight-summary/
├── docs/
│   └── GDD.md
└── logs/
```

---

## 18. Skill은 서로 조합되게 설계하기

원문에서 Skills는 이름으로 서로 참조하게 만들 수 있다고 본다. fileciteturn0file0  
Dev Survival에서는 아래 조합이 특히 유효하다.

### 조합 예시 1
`read-gdd-enemies` → `build-enemy-wave-system` → `verify-enemy-timeline`

### 조합 예시 2
`read-gdd-skills` → `build-skill-levelup-system` → `verify-gdd-vs-code`

### 조합 예시 3
`handoff-module-summary` → `write-experiment-log` → `update-gdd-from-implementation`

즉, Skill은 단독 완결보다  
**작은 파이프라인으로 엮이는 구조**가 좋다.

---

## 19. Subagent 구조와 Skills를 어떻게 매핑할까

Dev Survival GDD Part 10 기준으로 Skills는 아래처럼 대응시키는 것이 자연스럽다.

### Raf (Core System Designer)
추천 Skills:
- `read-gdd-core-loop`
- `build-player-foundation`
- `verify-3min-run`

### Marv (Enemy & Combat Designer)
추천 Skills:
- `read-gdd-enemies`
- `build-enemy-wave-system`
- `verify-enemy-timeline`

### Haon (Player Skill & Progression Designer)
추천 Skills:
- `read-gdd-skills`
- `build-skill-levelup-system`
- `verify-skill-balance-basics`

### Mason (UI/UX Flow Designer)
추천 Skills:
- `read-gdd-economy-ui`
- `build-hud-lobby-result-ui`
- `verify-ui-flow`

### Milli (GDD Editor / Documentation Designer)
추천 Skills:
- `update-gdd-from-implementation`
- `write-change-log`
- `check-gdd-delta`

### Fleeky (AI Experiment Logger)
추천 Skills:
- `log-subagent-run`
- `summarize-ai-insights`
- `compare-runs`

---

## 20. Dev Survival에서 가장 먼저 만들면 좋은 Skill 5개

### 1) `read-gdd-enemies`
목적:
- Part 4를 근거로 적 시스템 구현 단위를 안정적으로 뽑기

### 2) `build-enemy-wave-system`
목적:
- enemies.js / spawner.js 초기 구조를 빠르게 만들기

### 3) `verify-enemy-timeline`
목적:
- AI봇 등장 시점, 스폰 간격, 최대 적 수 검증

### 4) `handoff-module-summary`
목적:
- 다음 에이전트에 넘길 정보 표준화

### 5) `update-gdd-from-implementation`
목적:
- 구현 변경이 GDD와 어긋나지 않도록 유지

이 5개만 있어도 실제 운영 품질이 꽤 달라진다.

---

## 21. 실제 호출 예시

### 예시 1 — Marv 호출
“`read-gdd-enemies` skill을 사용해서 Part 4 기준 적 5종 책임과 패턴을 구현 단위로 분해해줘.”

### 예시 2 — 구현 후 검증
“`verify-enemy-timeline` skill을 사용해서 현재 spawner 구현이 GDD Part 4.4와 일치하는지 점검해줘.”

### 예시 3 — 핸드오프
“`handoff-module-summary` skill로 Marv의 산출물을 Haon과 Mason이 이해할 수 있게 정리해줘.”

### 예시 4 — 문서 동기화
“`update-gdd-from-implementation` skill로 실제 구현 변경 사항을 GDD 변경 이력 형식으로 정리해줘.”

---

## 22. 이 프로젝트에서 자주 생길 실패 패턴

### 1) GDD 밖 기능 추가
AI가 “더 좋아 보이는 방향”으로 새 기능을 끼워 넣음

### 2) 역할 침범
Enemy Designer가 UI까지 제안하거나, UI Designer가 밸런스를 건드림

### 3) MVP와 확장안 혼합
`낮잠자기` 같은 확장 요소가 기본 구현안처럼 섞임

### 4) 핸드오프 불명확
다음 에이전트가 무엇을 받아야 하는지 불분명

### 5) 구현은 했는데 검증이 없음
3분 루프, AI봇 등장 시점, 결과 화면 분기가 실제로 맞는지 확인 안 함

이 실패를 줄이기 위해 Skill마다 **Gotchas + Verification + Handoff**가 필요하다.

---

## 23. 추천 운영 원칙 요약

### 원칙 1
**GDD Part를 먼저 고정하고 Skill을 부른다**

### 원칙 2
**Skill 하나는 역할 하나에 집중시킨다**

### 원칙 3
**Skill 폴더 안에 템플릿, 예시, gotchas, 스크립트를 같이 둔다**

### 원칙 4
**구현 Skill만큼 검증 Skill을 중요하게 만든다**

### 원칙 5
**Subagent마다 사용하는 Skill 세트를 정해둔다**

### 원칙 6
**변경이 생기면 GDD와 로그를 같이 갱신한다**

---

## 24. 최종 정리

Dev Survival에서 Skills를 잘 쓴다는 건 단순히 “Claude에게 더 잘 시킨다”는 뜻이 아니다.  
핵심은 아래다.

- GDD를 기준으로 작업 단위를 분리하고
- 그 단위에 맞는 Skill을 만들고
- 각 Skill이 언제 호출되어야 하는지 명확히 하고
- 결과를 검증하고
- 변경을 문서와 로그에 남기는 것

즉, 이 프로젝트에서 Skill은 **프롬프트 파일**이 아니라  
**제작 방식 자체를 표준화하는 작업 단위**다.

---

## 25. 한 줄 요약

**Dev Survival용 Skills는 “GDD를 읽고, 역할을 지키고, 검증하고, 핸드오프하고, 기록하는” 흐름으로 설계해야 한다.**
