# agent-review — 검수 스킬
> **유형**: 절차형
> **사용자**: Tong (디렉터)
> **목적**: 서브 에이전트 작업 완료 보고를 받아 검수하고, 통과/재작업을 결정한다

---

## 입력

에이전트로부터 받는 보고:
```
Done: [완료 요약]
Files Modified: [파일 목록]
ETD Actual: [실제 소요]분
Handoff: [다음 에이전트에게 넘길 정보]
```

---

## 검수 절차

### Step 1 — Brief 기준 대조
```
.claude/briefs/[TASK_ID]-[assignee].md 의 검수 기준을 읽는다
체크리스트 항목 하나씩 확인
```

### Step 2 — 파이프라인 검증기 결과 확인
```
.claude/pipeline/reports/ 에서 해당 파일의 최신 리포트 확인
→ error 항목이 있으면 즉시 재작업 지시
→ warn 항목은 Tong이 판단 (무시 or 수정)
```

### Step 3 — 인터페이스 계약 확인
```
agents/main-agent.md 의 "모듈 인터페이스 계약" 섹션과 대조
→ 외부 노출 메서드/변수가 명세와 일치하는가
```

### Step 4 — 판정

**통과 조건:**
- [ ] Brief 검수 기준 전항목 충족
- [ ] pipeline reports error 없음
- [ ] 인터페이스 계약 충족
- [ ] GDD 범위 이탈 없음

**재작업 트리거:**
- pipeline error 1개 이상
- 검수 기준 미충족 1개 이상
- 인터페이스 불일치

---

### Step 5 — 결과 처리

**통과 시:**
```
1. manifest.json 태스크 status → "done", completedAt 기록
2. etd-lookup.json 해당 에이전트/작업단위 EMA 갱신
   new_etd = 0.3 * actual + 0.7 * old_etd
3. Handoff 정보를 다음 에이전트 Brief에 반영 예약
4. Fleeky에게 완료 기록 요청 (선택)
```

**재작업 시:**
```
1. 구체적인 실패 항목 목록 작성
2. 해당 에이전트에게 재지시 (Brief 수정본 발행)
3. manifest.json 태스크 status → "review-failed"
4. 실패 원인이 새로운 패턴이면 .claude/pipeline/lessons.md에 기록 요청
```

---

## ETD 갱신 공식

```javascript
// alpha = 0.3 (etd-lookup.json _meta 참조)
new_etd = Math.round((0.3 * actual + 0.7 * old_etd) * 10) / 10
samples += 1
last_actual = actual
```

---

## 주의
- 검수는 Brief 기준이 절대 기준. 주관적 판단 최소화.
- 재작업 지시 시 "무엇이 왜 실패했는지" 명시 필수
- 통과/실패 판정은 Tong이 하지만, 수치 검증은 파이프라인에 위임
