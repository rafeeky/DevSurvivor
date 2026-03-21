# Dev Survival — 진행 현황

> 최종 업데이트: 2026-03-22
> GDD 버전: 0.7
> 빌드: `docs/index.html` (183.7 KB)

---

## 완료된 작업

### 핵심 게임 시스템

| 파일 | 내용 | 상태 |
|------|------|------|
| `game.js` | GameState, Game 인터페이스, 게임 루프, 카메라, 3분 타이머 | ✅ |
| `entities/player.js` | WASD 이동, HP 100, 무적, 버프, 보호막, `_charPassive` 태그, 저체력 피해 감소(survivor) | ✅ |
| `entities/enemies.js` | 5종 적 — **박스봇·블루패치·모니터헤드·제럴드·미러워커**, ErrorBullet, HazardZone | ✅ |
| `entities/skills.js` | SkillManager — 액티브 7종 + 패시브 2종 | ✅ |
| `systems/spawner.js` | 6구간 타임라인 (BoxBot→AIBot), 투사체·방해구역 update/render | ✅ |
| `systems/levelup.js` | 경험치 누적, 레벨업 3지선다, **Q/W/E** 키 + 클릭 선택 (1/2/3 스킬키 충돌 해소) | ✅ |
| `systems/score.js` | 점수 공식, 출시 진행률, localStorage 최고 기록 | ✅ |
| `systems/meta.js` | 메타 업그레이드 10종, 출시 포인트 경제, localStorage 연동 | ✅ |

### 캐릭터 패시브 시스템 (Session 1)

| 파일 | 변경 내용 | 상태 |
|------|---------|------|
| `entities/charsprites.js` | `roleType`, `roleColor`, `passive`, `passiveDesc`, `sublabel` 필드 추가 (3캐릭터) | ✅ |
| `entities/player.js` | `_charPassive` 필드, `takeDamage()` 내 survivor 저체력 피해 -20% 로직 | ✅ |
| `game.js` | `_applyCharacterPassive()` 함수 — Game.start() 내 MetaManager 이후 호출 | ✅ |
| `ui/lobby.js` | 역할 타입 배지 (색상 테두리), 패시브명, 카드 높이 148px, 버튼 위치 조정 | ✅ |

**캐릭터별 패시브 효과:**
- `adam` (속도형): `expMultiplier +0.2`, `baseSpeed +20`
- `alex` (처리형): `skillDamageMult +0.2`, 디버그 쿨다운 -0.5초
- `amelia` (버티기형): `healMultiplier +0.25`, 시작 보호막 +1, 체력 <30% 피해 -20%

### 폰트 시스템 (Session 2)

| 위치 | 내용 | 상태 |
|------|------|------|
| `bundle.js` HTML head | Pixelify Sans + VT323 Google Fonts 링크 추가 | ✅ |
| `bundle.js` regex | `(\d+)px monospace` → `Press Start 2P` 자동 변환 | ✅ |
| `ui/hud.js` | 모든 폰트 → `"Pixelify Sans", sans-serif` | ✅ |
| `ui/result.js` | 모든 폰트 → `"Pixelify Sans", sans-serif` | ✅ |
| `ui/lobby.js` | 모든 폰트 → `"Pixelify Sans", sans-serif` | ✅ |
| `game.js` | 신규 적 등장 알림 배너 → `"VT323", cursive` | ✅ |

**3단계 폰트 규칙:**
- Press Start 2P: 타이틀, 결과 헤드라인 (bundle.js가 monospace 자동 변환)
- Pixelify Sans: HUD, 버튼, 팝업 본문, 캐릭터 설명
- VT323: 시스템 메시지, 경고 배너, 적 등장 알림

### 오피스 맵 (Session 3)

| 파일 | 내용 | 상태 |
|------|------|------|
| `systems/tilemap.js` | WORLD_W=2400, WORLD_H=1800, tileset_room.png 타일 렌더 | ✅ |
| `systems/tilemap.js` | 9개 구역 레이아웃 (개발팀·회의실·서버실·오픈플랜·휴게실·복도·기획팀·보스룸·창고) | ✅ |
| `systems/tilemap.js` | 오피스 프랍 60여 개 (office-props + julia 팩 에셋 사용) | ✅ |

**이번 세션 수정:**
- offscreen canvas bake 방식 → **뷰포트 내 타일 직접 렌더** 방식으로 교체 (렌더링 버그 수정)

### GDD v0.7 변경 사항 (2026-03-22)

| 항목 | 변경 내용 |
|------|---------|
| 보스 처치 플로우 | 미러워커 처치 → 골드 다이아 드롭 → "퇴근하세요!" 힌트 → 픽업 시 게임 종료 (180s 자동 승리 제거) |
| 적 이름/행동 | CartBot→**블루패치**(이동보정 AI, 2.5초 빠른 돌진), PCBot→**모니터헤드**(스캔 빔 + 오류탄), MirrorBot→**제럴드**(친근접근 + 2회 베기), AIBot→**미러워커** |
| 스프라이트 | BoxBot walk → `boxbot_walk.png` (6프레임), PCBot → `robot3_walk.png` (6프레임) |
| 입력 분리 | 레벨업 카드 선택 1/2/3 → **Q/W/E** (스킬 1/2/3/4와 충돌 해소) |
| HUD 개선 | 출시% 빨간색·크게, 스킬 슬롯에 타입 뱃지 (공격/회복/이속↑/방어/패시브) |
| 로비 개선 | 캐릭터 카드 텍스트 크게, 잠금 해제 조건 카드 내부 표시, 출시 포인트 빨간색 |
| UI 에셋 | 버튼·패널 전체 drawUIPanel(9-slice) 적용 (lobby/result/levelup) |
| 뱀파이어 해금 | 클릭 팝업 → 카드 내 "보스 처치 후 골드 다이아 × 1 획득 → 자동 해금" 안내 |

### 스프라이트 / 에셋

| 파일 | 내용 | 상태 |
|------|------|------|
| `entities/charsprites.js` | adam(Tommy 32x32), alex(Alex 16x16), amelia(Julia 32x32) idle/walk/action/hit 애니메이션 | ✅ |
| `entities/enemysprites.js` | 적 스프라이트 정의 | ✅ |
| `ui/lobby.js` | 캐릭터 카드 내 idle 스프라이트 프리뷰 | ✅ |
| `assets/custom/backgrounds/bg_office.png` | 로비 배경 이미지 | ✅ |

### UI

| 파일 | 내용 | 상태 |
|------|------|------|
| `ui/hud.js` | HP 바, 타이머, 스킬 슬롯 4개, 경험치 바, 출시 진행률 | ✅ |
| `ui/lobby.js` | 로비 — 캐릭터 선택 3종, 시작 버튼, 업그레이드 버튼, 최고 기록·포인트 표시 | ✅ |
| `ui/result.js` | 결과 — Dev Win! / AI Win!, 획득 포인트, 업그레이드 버튼 | ✅ |
| `ui/joystick.js` | 모바일 가상 조이스틱 | ✅ |

### 빌드 & 설정

| 항목 | 내용 | 상태 |
|------|------|------|
| `bundle.js` | 단일 파일 번들러 (docs/index.html 생성) | ✅ |
| `docs/index.html` | 배포용 단일 파일 148.6 KB | ✅ |
| `.claude/settings.json` | PostToolUse 검증 훅, PostCompact 자기강화 훅, model: opus | ✅ |
| `GDD.md` | v0.6 — Part 3.4~3.6 캐릭터 패시브, Part 7.0 폰트 규칙, Part 8.1b 오피스 맵, Part 11 에셋 목록 | ✅ |

---

## 남은 작업

### 버그 / 렌더링 확인 필요

| 항목 | 내용 | 우선순위 |
|------|------|---------|
| 타일맵 실제 표시 확인 | tileset_room.png 타일이 브라우저에서 정상 렌더되는지 육안 확인 필요 | 높음 |
| 오피스 프랍 경로 확인 | `assets/packs/office-props/`, `assets/packs/julia/` 내 파일명 실제 존재 여부 | 중간 |

### 게임플레이 폴리싱

| 항목 | 내용 | 우선순위 |
|------|------|---------|
| 밸런스 조정 | 플레이테스트 피드백 반영 (적 HP, 스킬 데미지, 스폰 간격) | 중간 |
| 낮잠자기 스킬 완성 | GDD에 "미구현" 표기 — levelup.js에서 처리 필요 | 낮음 |
| 스킬 3단계 강화 | levelup.js에 강화 단계별 수치 확인/구현 | 낮음 |
| 메타 업그레이드 화면 polish | 카드 디자인 개선, 애니메이션 | 낮음 |

### 사운드 (선택)

| 항목 | 내용 | 우선순위 |
|------|------|---------|
| BGM | 오피스 테마 배경음악 | 낮음 (선택) |
| 스킬음 / 처치음 / 레벨업음 | Web Audio API 또는 mp3 | 낮음 (선택) |

### 배포

| 항목 | 내용 | 상태 |
|------|------|------|
| GitHub Pages 배포 | `docs/index.html` → 사내 링크 공유 | 대기 중 |
| 플레이테스트 수집 | 사내 링크 배포 + 피드백 수집 | 대기 중 |

---

## 파일 구조 현재 상태

```
DevSurvivor/
├── game.js                      ✅ 완료 (패시브 적용, 카메라, 3분 루프)
├── bundle.js                    ✅ 완료 (폰트 변환, 에셋 복사)
├── GDD.md                       ✅ v0.6
├── progress.md                  ✅ 이 파일
├── entities/
│   ├── charsprites.js           ✅ 완료 (3캐릭터 패시브 메타데이터)
│   ├── enemysprites.js          ✅ 완료
│   ├── player.js                ✅ 완료 (_charPassive, 저체력 피해 감소)
│   ├── enemies.js               ✅ 5종 완료
│   └── skills.js                ✅ 7종 액티브 + 2종 패시브
├── systems/
│   ├── tilemap.js               ✅ 완료 (9구역 오피스 맵, 뷰포트 직접 렌더)
│   ├── spawner.js               ✅ 6구간 타임라인
│   ├── levelup.js               ✅ 완료
│   ├── score.js                 ✅ 완료
│   └── meta.js                  ✅ 10종 메타 업그레이드
├── ui/
│   ├── hud.js                   ✅ 완료 (Pixelify Sans 폰트)
│   ├── lobby.js                 ✅ 완료 (캐릭터 카드 + 역할 배지 + 패시브명)
│   ├── result.js                ✅ 완료 (Pixelify Sans 폰트)
│   └── joystick.js              ✅ 모바일 조이스틱
├── assets/
│   ├── backgrounds/             ✅ tileset_room.png, tileset_interiors.png
│   ├── custom/player/           ✅ tommy_idle/walk/action/hit.png
│   ├── custom/backgrounds/      ✅ bg_office.png
│   ├── characters/              ✅ Alex_idle/run_16x16.png
│   ├── packs/julia/             ✅ Julia 스프라이트 + 오피스 가구
│   ├── packs/office-props/      ✅ Desk, Chair, Plant 등 40여 종
│   └── enemies/                 ✅ 적 스프라이트
├── docs/
│   ├── index.html               ✅ 배포용 번들 (148.6 KB)
│   └── assets/                  ✅ 에셋 복사본
└── .claude/
    ├── settings.json            ✅ 훅 + model: opus
    └── pipeline/                ✅ validate.js, lessons.md
```

---

## 버그 수정 이력

| 버그 | 원인 | 수정 |
|------|------|------|
| PCBot 속도 디버프 시 컨트롤 역전 | `applyBuff('speed', -0.3)` → 음수 배율 | 값 `-0.3` → `0.7` (30% 감소) |
| 패시브 이동속도 버프 매 프레임 초기화 | `_recalcBuffs()`가 `speedMult=1`로 덮어씀 | `_baseSpeedMult` 기저 배율 추가 |
| 패시브 피해 감소 버프 매 프레임 초기화 | `_baseDmgMult` 부재 | `_baseDmgMult` 기저 배율 추가 |
| 타일맵 미표시 (검은 배경) | offscreen canvas bake 실패 (이미지 로딩 타이밍 문제) | 뷰포트 내 타일 직접 렌더 방식으로 교체 |
