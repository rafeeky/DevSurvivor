// bundle.js — Dev Survivor 단일 파일 번들 생성기
const fs = require('fs')
const path = require('path')

const BASE = __dirname

// 로드 순서 (game.js는 별도 처리)
const SCRIPTS = [
  'entities/player.js',
  'entities/enemies.js',
  'entities/skills.js',
  'systems/spawner.js',
  'systems/levelup.js',
  'systems/score.js',
  'systems/meta.js',
  'ui/hud.js',
  'ui/lobby.js',
  'ui/result.js',
  'ui/joystick.js',
]

function readFile(rel) {
  return fs.readFileSync(path.join(BASE, rel), 'utf8')
}

// game.js에서 dynamic import 제거 → 동기 초기화로 변환
function processGameJs(src) {
  // tryImport 함수 제거
  src = src.replace(/async function tryImport[\s\S]*?\n\}\n/, '')
  // async IIFE 전체 제거 후 동기 초기화로 대체
  src = src.replace(/;\(async \(\) => \{[\s\S]*?\}\)\(\)/, `
// 모든 모듈 이미 로드됨 — 동기 초기화
window.dispatchEvent(new Event('gameReady'))
Game.init()
`)
  return src
}

const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: 'Courier New', Courier, monospace;
    }
    #gameCanvas {
      display: block;
      border: 2px solid #2a2a5e;
      box-shadow: 0 0 40px rgba(68, 136, 255, 0.3);
    }
`

let scriptBlocks = ''
for (const rel of SCRIPTS) {
  const code = readFile(rel)
  scriptBlocks += `\n  <!-- ${rel} -->\n  <script>\n${code}\n  </script>\n`
}

const gameJs = processGameJs(readFile('game.js'))
scriptBlocks += `\n  <!-- game.js -->\n  <script>\n${gameJs}\n  </script>\n`

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dev Survivor</title>
  <style>${css}</style>
</head>
<body>
  <canvas id="gameCanvas" width="800" height="600"></canvas>
${scriptBlocks}
</body>
</html>
`

const outPath = path.join(BASE, 'docs', 'index.html')
fs.mkdirSync(path.join(BASE, 'docs'), { recursive: true })
fs.writeFileSync(outPath, html, 'utf8')

const size = (fs.statSync(outPath).size / 1024).toFixed(1)
console.log(`✅ 번들 완료: docs/index.html (${size} KB)`)
