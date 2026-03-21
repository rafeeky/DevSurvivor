#!/usr/bin/env node
/**
 * .claude/pipeline/validate.js
 * PostToolUse 훅에서 호출되는 정적 분석기.
 * stdin: Claude tool_use JSON / stdout: hookSpecificOutput JSON
 */

const fs   = require('fs')
const path = require('path')

const ROOT    = process.cwd()
const LESSONS = path.join(ROOT, '.claude/pipeline/lessons.md')
const REPORTS = path.join(ROOT, '.claude/pipeline/reports')

let raw = ''
process.stdin.on('data', d => raw += d)
process.stdin.on('end', () => {
  try { main(JSON.parse(raw || '{}')) }
  catch { process.exit(0) }
})

// ─────────────────────────────────────────
function main(data) {
  const filePath = data.tool_input?.file_path
  if (!filePath || !/\.js$/.test(filePath)) return
  if (!fs.existsSync(filePath)) return

  const src = fs.readFileSync(filePath, 'utf8')
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/')
  const issues = []

  checkCtxBalance(src, rel, issues)
  checkAssetPaths(src, rel, issues)
  checkBundleInclusion(filePath, rel, issues)
  checkKnownAntiPatterns(src, rel, issues)
  applyLessons(src, rel, issues)

  if (issues.length === 0) return

  saveReport(issues, rel)
  autoLearn(issues, rel)
  report(issues)
}

// ─── 검사 1: ctx.save / ctx.restore 균형 ──────────────────────────────────
function checkCtxBalance(src, rel, issues) {
  const saves    = (src.match(/ctx\.save\(\)/g)    || []).length
  const restores = (src.match(/ctx\.restore\(\)/g) || []).length
  if (saves !== restores) {
    issues.push({
      level: 'warn', code: 'CTX_BALANCE',
      msg: `ctx.save(${saves}) ≠ ctx.restore(${restores}) → 렌더 상태 누적 위험`,
      file: rel,
    })
  }
}

// ─── 검사 2: 에셋 경로 실존 ───────────────────────────────────────────────
function checkAssetPaths(src, rel, issues) {
  for (const m of src.matchAll(/['"`](assets\/[^'"`\s\\)]+)/g)) {
    const assetRel  = m[1]
    const assetFull = path.join(ROOT, assetRel)
    if (!fs.existsSync(assetFull)) {
      issues.push({
        level: 'error', code: 'ASSET_MISSING',
        msg: `에셋 없음: ${assetRel}`,
        file: rel,
      })
    }
  }
}

// ─── 검사 3: bundle.js SCRIPTS 포함 여부 ────────────────────────────────
function checkBundleInclusion(filePath, rel, issues) {
  if (!/\/(entities|systems|ui)\//.test(filePath)) return
  const bundlePath = path.join(ROOT, 'bundle.js')
  if (!fs.existsSync(bundlePath)) return
  const bundle = fs.readFileSync(bundlePath, 'utf8')
  if (!bundle.includes(rel)) {
    issues.push({
      level: 'error', code: 'BUNDLE_MISSING',
      msg: `bundle.js SCRIPTS에 '${rel}' 없음 → docs/index.html 미반영`,
      file: rel,
    })
  }
}

// ─── 검사 4: 프로젝트 특이 안티패턴 ─────────────────────────────────────
function checkKnownAntiPatterns(src, rel, issues) {
  // Game.gameOver() 직후 return 없는 패턴
  const lines = src.split('\n')
  for (let i = 0; i < lines.length - 1; i++) {
    if (/Game\.gameOver\(/.test(lines[i])) {
      const next = lines[i + 1]?.trim() || ''
      if (next && !/^(return|})/.test(next) && next !== '') {
        issues.push({
          level: 'warn', code: 'GAMEOVER_NO_RETURN',
          msg: `Game.gameOver() 후 return 없음 (line ${i + 1}) → 이후 코드 계속 실행됨`,
          file: rel,
        })
      }
    }
  }

  // 구버전 에셋 경로 잔재 (Lesson #005)
  if (/assets\/Modern tiles_Free/.test(src)) {
    issues.push({
      level: 'error', code: 'OLD_ASSET_PATH',
      msg: `구버전 경로 'assets/Modern tiles_Free' 발견 → 'assets/characters/'로 교체 필요`,
      file: rel,
    })
  }
}

// ─── 검사 5: lessons.md 커스텀 패턴 적용 ────────────────────────────────
function applyLessons(src, rel, issues) {
  if (!fs.existsSync(LESSONS)) return
  const text   = fs.readFileSync(LESSONS, 'utf8')
  const blocks = text.split(/^## Lesson/m).slice(1)

  for (const block of blocks) {
    const grepMatch = block.match(/\*\*Grep\*\*:\s*`([^`]+)`/)
    if (!grepMatch || grepMatch[1].startsWith('(')) continue  // skip manual checks
    try {
      const rx = new RegExp(grepMatch[1])
      if (rx.test(src)) {
        const patternMatch = block.match(/\*\*Pattern\*\*:\s*(.+)/)
        issues.push({
          level: 'warn', code: 'LESSON_HIT',
          msg: `알려진 패턴 감지: ${patternMatch?.[1]?.trim() || '(unknown)'}`,
          file: rel,
        })
      }
    } catch { /* 정규식 오류 무시 */ }
  }
}

// ─── 리포트 저장 ─────────────────────────────────────────────────────────
function saveReport(issues, rel) {
  try {
    fs.mkdirSync(REPORTS, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const name  = rel.replace(/\//g, '_')
    fs.writeFileSync(
      path.join(REPORTS, `${stamp}__${name}.json`),
      JSON.stringify({ timestamp: new Date().toISOString(), file: rel, issues }, null, 2)
    )
  } catch {}
}

// ─── 새 패턴 자동 학습 → lessons.md 추가 ────────────────────────────────
function autoLearn(issues, rel) {
  const newErrors = issues.filter(i =>
    i.level === 'error' &&
    i.code !== 'LESSON_HIT' &&
    i.code !== 'ASSET_MISSING'  // 파일별로 달라서 일반화 불가
  )
  if (newErrors.length === 0) return

  let existing = ''
  try { existing = fs.existsSync(LESSONS) ? fs.readFileSync(LESSONS, 'utf8') : '' } catch {}

  const nums    = [...existing.matchAll(/## Lesson #(\d+)/g)].map(m => parseInt(m[1]))
  let nextNum   = (Math.max(0, ...nums) + 1)
  let additions = ''

  for (const issue of newErrors) {
    if (existing.includes(issue.code)) continue  // 이미 있는 코드
    additions += `
## Lesson #${String(nextNum++).padStart(3, '0')}
**Pattern**: ${issue.msg}
**Root Cause**: (자동 감지 — 다음 세션에서 원인 분석 필요)
**Fix**: (미정)
**Grep**: \`${issue.code}\`
**Detected**: ${new Date().toISOString().slice(0, 10)} (${rel})
`
  }

  if (additions) {
    fs.appendFileSync(LESSONS, additions)
  }
}

// ─── 모델에 결과 주입 ────────────────────────────────────────────────────
function report(issues) {
  const lines = issues.map(i => {
    const icon = i.level === 'error' ? '❌' : i.level === 'warn' ? '⚠️' : 'ℹ️'
    return `${icon} [${i.code}] ${i.msg}`
  })

  const errors = issues.filter(i => i.level === 'error').length
  const warns  = issues.filter(i => i.level === 'warn').length
  const header = `🔍 Pipeline Validator (${errors > 0 ? `error:${errors} ` : ''}${warns > 0 ? `warn:${warns}` : ''})`

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `${header}\n${lines.join('\n')}`,
    },
  }))
}
