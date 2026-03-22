window.VIEWER_DATA = {
  "project": {
    "subtitle": "3분 생존 게임. AI 서브 에이전트 협업",
    "version": "v0.7 · M8",
    "statusText": "M8 완료",
    "status": "done"
  },
  "stats": [
    { "val": "7", "lbl": "에이전트" },
    { "val": "4", "lbl": "페이즈" },
    { "val": "9", "lbl": "마일스톤 완료" },
    { "val": "6", "lbl": "핸드오프 충돌" },
    { "val": "5", "lbl": "실험 가설" }
  ],
  "phases": [
    { "id": 1, "name": "코어 설계",  "desc": "게임 루프·플레이어·GameState 기반",   "agents": ["raf"],                 "status": "done" },
    { "id": 2, "name": "병렬 개발",  "desc": "적 시스템 + 스킬 + UI 동시 개발",     "agents": ["marv","haon","mason"],  "status": "done" },
    { "id": 3, "name": "통합 빌드",  "desc": "모듈 연결, 충돌 해결, 폴리시",         "agents": ["tong","raf"],           "status": "done" },
    { "id": 4, "name": "문서화",     "desc": "GDD 동기화, 실험 로그, 인사이트",       "agents": ["milli","fleeky"],       "status": "done" }
  ],
  "milestones": [
    { "id": "M1",  "title": "프로젝트 초기화",    "desc": "GDD + agents 컨텍스트 작성",                              "agents": ["tong","milli"],              "status": "done" },
    { "id": "M2",  "title": "코어 루프",          "desc": "GameState + 플레이어 이동/HP/버프",                        "agents": ["raf"],                       "status": "done" },
    { "id": "M3",  "title": "적 & 스폰",          "desc": "BoxBot~AIBot 5종 + 6구간 타임라인",                       "agents": ["marv"],                      "status": "done" },
    { "id": "M4",  "title": "스킬 & 성장",        "desc": "9종 스킬 + 경험치/레벨업 3지선다",                        "agents": ["haon"],                      "status": "done" },
    { "id": "M5",  "title": "UI & 메타",          "desc": "HUD + 로비 + 결과 + 업그레이드 10종",                     "agents": ["mason"],                     "status": "done" },
    { "id": "M6",  "title": "통합 & 폴리시",      "desc": "충돌 6건 해결 + 연출 추가",                               "agents": ["tong","raf"],                "status": "done" },
    { "id": "M7",  "title": "문서 & 인사이트",    "desc": "GDD v0.5 완성 + 실험 로그",                               "agents": ["milli","fleeky"],            "status": "done" },
    { "id": "M8",  "title": "스프라이트 & 전투",  "desc": "커스텀 에셋 통합·캐릭터 패시브·오피스 맵 (T001~T020)",   "agents": ["raf","mason","marv","haon"], "status": "done" },
    { "id": "M9",  "title": "사운드",             "desc": "BGM (오피스 테마) + 스킬음·처치음·레벨업음 (Web Audio API)", "agents": ["raf"],                    "status": "done" },
    { "id": "M10", "title": "배포 & 플레이테스트","desc": "GitHub Pages 배포, 밸런스 조정, 피드백 수집",              "agents": ["tong","mason"],              "status": "pend" }
  ],
  "agents": [
    {
      "id": "tong", "name": "Tong", "role": "게임 디렉터",
      "model": "Claude Opus", "color": "#9333ea",
      "agentStatus": "done", "waveLabel": "Wave 1~4 + M8", "tokens": "58.4k", "elapsed": "01:38:12", "commits": 17,
      "currentTask": null,
      "phases": [1,2,3,4],
      "tasks": [
        "Phase 1–4 전체 오케스트레이션",
        "모듈 간 충돌 6건 해결",
        "최종 통합 빌드 검수",
        "M8 에셋 폴더 재구성 (used/unused/archive)",
        "파이프라인 검증기 구축 (validate.js + PostCompact 루프)"
      ]
    },
    {
      "id": "raf", "name": "Raf", "role": "리드 프로그래머",
      "model": "Claude Sonnet", "color": "#06b6d4",
      "agentStatus": "done", "waveLabel": "Wave 1+3+M8+M9", "tokens": "52.7k", "elapsed": "01:14:45", "commits": 28,
      "currentTask": null,
      "phases": [1,3],
      "tasks": [
        "game.js + GameState 구조 설계",
        "rAF 루프 (delta time, 60fps)",
        "player.js 이동/HP/버프/무적 + 캐릭터 패시브",
        "tilemap WORLD_ROWS 소수점 버그 수정 (Math.floor)",
        "타일맵 뷰포트 직접 렌더 교체 (offscreen 방식 제거)",
        "Alex 스프라이트 빌드타임 밝기 보정 (brightenSprite 1.8×)",
        "인게임 캐릭터 스프라이트 스케일 상향 (2→3, 3→4)",
        "BGM + 효과음 Web Audio API 구현"
      ]
    },
    {
      "id": "marv", "name": "Marv", "role": "전투 디자이너",
      "model": "Claude Sonnet", "color": "#f97316",
      "agentStatus": "done", "waveLabel": "Wave 3+M8", "tokens": "45.8k", "elapsed": "00:46:30", "commits": 13,
      "currentTask": null,
      "phases": [2],
      "tasks": [
        "BoxBot~미러워커 5종 적 구현",
        "6구간 스폰 타임라인",
        "투사체(ErrorBullet) + 방해구역(HazardZone) 시스템",
        "적 스프라이트 연결 (Sprite Pack 3 로봇)",
        "PCBot·MirrorBot·AIBot 특수 AI 행동 패턴 구현"
      ]
    },
    {
      "id": "haon", "name": "Haon", "role": "코어 시스템 디자이너",
      "model": "Claude Sonnet", "color": "#22c55e",
      "agentStatus": "done", "waveLabel": "Wave 4+M8", "tokens": "47.3k", "elapsed": "00:51:08", "commits": 14,
      "currentTask": null,
      "phases": [2],
      "tasks": [
        "스킬 9종 (액티브7 + 패시브2)",
        "쿨다운 + 강화 3단계 시스템",
        "경험치 커브 Lv1→6 + Q/W/E 키 선택",
        "스킬 시각 이펙트 6종 (beam/burst/float) 추가",
        "스킬 쿨다운 밸런스 조정"
      ]
    },
    {
      "id": "mason", "name": "Mason", "role": "UI/UX 디자이너",
      "model": "Claude Sonnet", "color": "#eab308",
      "agentStatus": "done", "waveLabel": "Wave 5+M8", "tokens": "51.2k", "elapsed": "00:58:40", "commits": 15,
      "currentTask": null,
      "phases": [2],
      "tasks": [
        "HUD (HP바/타이머/스킬슬롯·타입뱃지/경험치/출시%)",
        "로비 + 결과 화면 (승/패 분기, 3단계 페이드인)",
        "캐릭터 선택 UI — 역할 배지 + 패시브명 표시",
        "메타 업그레이드 10종 + localStorage 저장/복원",
        "모바일 조이스틱 (다이아몬드 레이아웃, 데드존 조정)",
        "Alex 로비 카드 대비 개선 + 포트레이트 스케일 수정"
      ]
    },
    {
      "id": "milli", "name": "Milli", "role": "게임 디자이너",
      "model": "Claude Sonnet", "color": "#ec4899",
      "agentStatus": "done", "waveLabel": "Wave 1+7+M8", "tokens": "32.1k", "elapsed": "00:29:05", "commits": 10,
      "currentTask": null,
      "phases": [1,4],
      "tasks": [
        "GDD v0.1 → v0.7 버전 관리",
        "수치 동기화 (40개 항목 체크)",
        "충돌 조율 선택지 A/B 제안",
        "GDD v0.7 업데이트 — 적 이름 변경·캐릭터 패시브·오피스 맵·입력체계"
      ]
    },
    {
      "id": "fleeky", "name": "Fleeky", "role": "리드 QA",
      "model": "Claude Sonnet", "color": "#64748b",
      "agentStatus": "running", "waveLabel": "All Waves", "tokens": "23.8k", "elapsed": "02:04:33", "commits": 9,
      "currentTask": "M9 사운드 완료 확인 — 최종 인사이트 기록 중",
      "phases": [4],
      "tasks": [
        "전 에이전트 작업 로그 기록",
        "핸드오프 충돌 6건 추적",
        "가설 H1–H5 검증 데이터",
        "M8 전 태스크 (T001~T020) 완료 검증",
        "ai_insights.md 최종 인사이트 정리"
      ]
    }
  ],
  "hypotheses": [
    { "id": "H1", "text": "명확한 역할 = 단독 완성",  "result": "partial",  "rtxt": "부분 검증", "note": "도메인 내부는 완성. 연결부에서 충돌 발생" },
    { "id": "H2", "text": "핸드오프 충돌 발생",        "result": "verified", "rtxt": "검증됨",    "note": "6건 발생 — 예상보다 많음" },
    { "id": "H3", "text": "감정 리듬 AI 판단 불가",    "result": "pending",  "rtxt": "보류",      "note": "플레이테스트 미진행으로 검증 보류" },
    { "id": "H4", "text": "분리 구조 = 시간 단축",     "result": "positive", "rtxt": "긍정적",    "note": "Phase 2 병렬 실행 효과 확인" },
    { "id": "H5", "text": "명세 상세 = 재작업 감소",   "result": "partial",  "rtxt": "부분 검증", "note": "재작업 0. 인터페이스 미명세 충돌" }
  ]
};
