# DevSurvivor 스킬 사용 가이드

> 스킬은 **Tong(디렉터)이 반복 업무를 구조화한 절차/생성 템플릿**이다.
> 각 스킬의 SKILL.md를 읽고, 그 절차대로 실행한다.

---

## 스킬 목록

| 스킬 | 유형 | 언제 쓰나 |
|------|------|---------|
| `brief-generator` | 생성형 | 서브 에이전트에게 작업 지시서를 줄 때 |
| `agent-dispatch` | 절차형 | manifest의 todo를 에이전트에 배분할 때 |
| `agent-review` | 절차형 | 에이전트 완료 보고를 검수할 때 |
| `headless-sim-validator` | 절차형 | 브라우저 없이 게임을 자동 테스트할 때 |

---

## 전형적인 Tong 워크플로우

```
1. manifest.json 확인 (현재 상태 파악)
2. agent-dispatch → 실행 가능 태스크 선별 + Brief 발행
3. brief-generator → .claude/briefs/*.md 생성
4. 서브 에이전트 실행 (Claude Code Sub-agent or 직접 대화)
5. 에이전트 완료 보고 수신
6. agent-review → 통과/재작업 판정
7. 통과 시: manifest 업데이트 + etd-lookup EMA 갱신
8. (선택) headless-sim-validator → 통합 테스트
```

---

## 핵심 데이터 파일

| 파일 | 역할 | 수정 권한 |
|------|------|---------|
| `agents/manifest.json` | 현재 파이프라인 상태 | Tong 전용 |
| `agents/agents.json` | 에이전트 레지스트리 | Tong 전용 |
| `agents/etd-lookup.json` | 작업시간 EMA 데이터 | Tong (review 후 자동) |
| `.claude/pipeline/lessons.md` | QA 지식 베이스 | validate.js + PostCompact |
| `.claude/briefs/*.md` | 발행된 지시서 | brief-generator 생성, 읽기 전용 |

---

## 스킬 개선 방법

1. 스킬 절차 중 반복되는 실수 발견 → `lessons.md`에 기록
2. 스킬 절차 개선 사항 → 해당 SKILL.md 직접 수정
3. 새 스킬 필요 시 → 이 파일에 목록 추가 + 스킬 폴더 생성
