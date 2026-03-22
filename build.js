/**
 * build.js — docs/index.html 번들 생성기
 * node build.js 로 실행
 */
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const OUT  = path.join(ROOT, 'docs', 'index.html')

const HTML_HEADER = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dev Survivor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
  <style>
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
</style>
</head>
<body>
  <canvas id="gameCanvas" width="800" height="600"></canvas>
`

// 번들 순서 (game.js는 마지막)
const FILES = [
  'entities/charsprites.js',
  'entities/enemysprites.js',
  'entities/player.js',
  'entities/enemies.js',
  'entities/skills.js',
  'systems/tilemap.js',
  'systems/spawner.js',
  'systems/drops.js',
  'systems/levelup.js',
  'systems/score.js',
  'systems/audio.js',
  'systems/meta.js',
  'ui/uiassets.js',
  'ui/hud.js',
  'ui/lobby.js',
  'ui/result.js',
  'ui/joystick.js',
  'game.js',
]

let out = HTML_HEADER

for (const file of FILES) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8')
  out += `\n  <!-- ${file} -->\n  <script>\n${src}\n  </script>\n`
}

out += `\n</body>\n</html>\n`

fs.writeFileSync(OUT, out, 'utf8')
console.log(`✅ docs/index.html 생성 완료 (${(out.length / 1024).toFixed(1)} KB)`)
