# DevSurvivor — Claude Code 규칙

## 커밋 메시지 형식

커밋/푸시 시 커밋 메시지는 반드시 작업을 수행한 agent 이름을 앞에 붙인다.

형식: `[agent-name] <type>: <내용>`

예시:
- `[agent-dispatch] feat: 몬스터 스폰 로직 추가`
- `[agent-review] fix: 충돌 판정 버그 수정`
- `[headless-sim-validator] test: 웨이브 시뮬레이션 검증`
- `[brief-generator] docs: 스킬 시스템 작업 지시서 작성`
- `[claude] refactor: 렌더링 파이프라인 정리`

agent 이름은 실제로 작업을 수행한 스킬/에이전트 이름을 사용한다.
메인 Claude가 직접 작업한 경우 `[claude]`를 사용한다.
