# brief-generator — 작업 지시서 생성 스킬
> **유형**: 생성형
> **사용자**: Tong (디렉터)
> **목적**: 서브 에이전트에게 전달할 작업 지시서(Brief)를 생성한다

---

## 입력

```
assignee: <에이전트 ID>          # raf | marv | haon | mason | milli | fleeky
task_id: <manifest.json 태스크 ID>  # T006 등
context: <추가 맥락 1~3줄>        # 선택
```

## 출력 형식

```markdown
# Brief — [TASK_ID] [태스크 제목]

**담당**: [에이전트 이름]
**발행**: Tong
**날짜**: YYYY-MM-DD
**예상 소요**: [etd-lookup.json 기준 ETD]분

---

## 목표
한 문장으로 이 작업의 목적.

## 선행 조건
- [ ] 의존 작업 목록 (dependsOn)
- [ ] 필요한 입력 파일

## 산출물 명세
- 파일명: `경로/파일.js`
- 외부에 노출해야 하는 인터페이스 (메서드, 변수)
- 금지 사항 (담당하지 않는 것)

## 검수 기준
- [ ] 항목 1
- [ ] 항목 2
- [ ] 항목 3

## 참조
- GDD Part X
- `agents/<name>.md`

## 보고 형식
```
Done: [완료 요약]
Files Modified: [파일 목록]
ETD Actual: [실제 소요 시간]분
Handoff: [다음 에이전트에게 넘길 정보]
```
```

---

## 실행 절차

1. `agents/manifest.json`에서 해당 task_id를 읽는다
2. `agents/agents.json`에서 assignee의 specFile을 확인한다
3. `agents/etd-lookup.json`에서 관련 작업 단위 ETD를 조회한다
4. 위 출력 형식에 맞춰 Brief를 생성한다
5. Brief를 `.claude/briefs/[TASK_ID]-[assignee].md`로 저장한다
6. manifest.json의 해당 task status를 `"briefed"`로 업데이트한다

---

## 주의
- Brief는 에이전트가 다른 파일을 탐색하지 않아도 되도록 **자급자족**해야 한다
- 산출물 명세의 인터페이스는 `main-agent.md`의 모듈 계약과 반드시 일치해야 한다
- GDD 범위 밖의 기능을 포함하지 않는다
