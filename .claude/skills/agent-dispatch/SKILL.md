# agent-dispatch — 작업 배분 스킬
> **유형**: 절차형
> **사용자**: Tong (디렉터)
> **목적**: manifest의 todo 태스크를 에이전트에게 배분하고 실행 순서를 결정한다

---

## 실행 절차

### Step 1 — 현황 파악
```
1. agents/manifest.json 읽기
   → completed, tasks(todo/in-progress), blocked 확인
2. agents/etd-lookup.json 읽기
   → 각 태스크의 예상 소요시간 합산
3. agents/agents.json 읽기
   → 각 에이전트의 현재 phase와 dependsOn 확인
```

### Step 2 — 실행 가능 태스크 선별
```
조건:
- status == "todo"
- dependsOn 태스크가 모두 completed
- blocked 목록에 없음

→ 실행 가능 태스크 목록 출력
```

### Step 3 — 병렬 실행 가능 여부 판단
```
병렬 가능 조건:
- 담당 파일(files)에 교집합 없음
- GameState 인터페이스만 공유 (파일 직접 참조 금지)

병렬 불가 → 순차 실행 (ETD 짧은 것 먼저)
```

### Step 4 — Brief 발행
```
각 태스크에 대해 brief-generator 스킬 실행
→ .claude/briefs/[TASK_ID]-[assignee].md 생성
```

### Step 5 — manifest 업데이트
```
배분된 태스크: status "todo" → "briefed"
배분 기록:
{
  "briefedAt": "YYYY-MM-DD",
  "etdTotal": N분
}
```

---

## 배분 원칙

| 우선순위 | 기준 |
|---------|------|
| 1 | blocked 해소에 필요한 선행 작업 |
| 2 | decisions_needed 결정이 완료된 작업 |
| 3 | 다른 에이전트의 dependsOn인 작업 |
| 4 | priority: high |
| 5 | ETD 짧은 것 (빠른 피드백 루프) |

---

## 금지 사항
- decisions_needed 항목은 사용자 결정 전 배분 금지
- 파일 교집합 있는 태스크를 병렬 배분 금지
- GDD에 없는 태스크를 신규 생성 금지 (→ 사용자 확인 필요)
