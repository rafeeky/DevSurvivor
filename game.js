/**
 * game.js — Dev Survival 진입점 & 코어 게임 루프
 * Integration Lead (메인 에이전트) 통합 버전
 */

async function tryImport(path) {
  try {
    await import(path)
  } catch (e) {
    console.warn(`[game.js] optional module not found: ${path}`)
  }
}

// ─────────────────────────────────────────
// 전역 상태
// ─────────────────────────────────────────
window.GameState = {
  screen: 'lobby',
  gameTime: 0,
  isRunning: false,
  isPaused: false,
  score: 0,
  releaseProgress: 0,
  killCount: 0,
  basicKills: 0,
  pcBotKills: 0,
  mirrorBotKills: 0,
  aiBotReached: false,
  aiBotKilled: false,
  enemies: [],
  projectiles: [],
  hazardZones: [],
  playerDanger: false,
  playerExpGained: 0,
  playerLevel: 1,
  playerExp: 0,
  _lastWin: false,
  aiBotIntro: false,
  aiBotIntroTimer: 0,
  // 메타 업그레이드 배율 (MetaManager.applyToPlayer 에서 설정)
  skillDamageMult: 1,
  expMultiplier:   1,
  healMultiplier:  1,
  lastEarnedPoints: 0,
}

// ─────────────────────────────────────────
// 키 입력
// ─────────────────────────────────────────
const inputKeys = {}

window.addEventListener('keydown', e => {
  inputKeys[e.code] = true
  if (
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR'].includes(e.code) &&
    GameState.screen === 'playing' &&
    !GameState.isPaused
  ) {
    const slot = ['KeyQ', 'KeyW', 'KeyE', 'KeyR'].indexOf(e.code)
    Game.skillManager?.activateSkill(slot)
  }
})
window.addEventListener('keyup', e => { inputKeys[e.code] = false })

// ─────────────────────────────────────────
// 배경 렌더링
// ─────────────────────────────────────────
function drawBackground(ctx) {
  ctx.fillStyle = '#0d0d1a'
  ctx.fillRect(0, 0, 800, 600)
  ctx.strokeStyle = '#1a1a3e'
  ctx.lineWidth = 1
  for (let x = 0; x < 800; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke()
  }
  for (let y = 0; y < 600; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke()
  }
}

// ─────────────────────────────────────────
// Game 인터페이스
// ─────────────────────────────────────────
window.Game = {
  canvas: null,
  ctx: null,
  player: null,
  enemySystem: null,
  skillManager: null,

  registerEnemySystem(spawner) { Game.enemySystem = spawner },
  registerSkillSystem(sm)      { Game.skillManager = sm },
  registerUI(ui)               { /* 통합 버전에서는 개별 모듈 직접 호출 */ },

  init() {
    Game.canvas = document.getElementById('gameCanvas')
    Game.ctx    = Game.canvas.getContext('2d')
    GameState.screen = 'lobby'
    _lastTime = performance.now()
    requestAnimationFrame(_loop)
  },

  start() {
    Object.assign(GameState, {
      screen: 'playing',
      gameTime: 0,
      isRunning: true,
      isPaused: false,
      score: 0,
      releaseProgress: 0,
      killCount: 0,
      basicKills: 0,
      pcBotKills: 0,
      mirrorBotKills: 0,
      aiBotReached: false,
      aiBotKilled: false,
      enemies: [],
      projectiles: [],
      hazardZones: [],
      playerDanger: false,
      playerExpGained: 0,
      playerLevel: 1,
      playerExp: 0,
      _lastWin: false,
      skillDamageMult: 1,
      expMultiplier:   1,
      healMultiplier:  1,
      lastEarnedPoints: 0,
      aiBotIntro: false,
      aiBotIntroTimer: 0,
    })

    // 플레이어 생성
    if (window.Player) {
      Game.player = new window.Player(400, 300)
      // skills.js가 playerCreated 이벤트를 듣고 SkillManager를 등록
      window.dispatchEvent(new CustomEvent('playerCreated', { detail: { player: Game.player } }))
      // 메타 업그레이드 효과 적용
      if (window.MetaManager) MetaManager.applyToPlayer(Game.player, Game.skillManager)
    }

    // Spawner 리셋 (spawnTimer 초기화)
    if (Game.enemySystem?.reset) Game.enemySystem.reset()
    else if (Game.enemySystem) Game.enemySystem.spawnTimer = 0

    // LevelUpManager 리셋
    if (window._levelUpManager) {
      window._levelUpManager.pendingLevelUp = false
      window._levelUpManager.choices = []
      window._levelUpManager.choiceRects = []
    }

    _lastTime = performance.now()
  },

  pause() {
    GameState.isPaused = true
    GameState.screen = 'paused'
  },

  resume() {
    GameState.isPaused = false
    GameState.screen = 'playing'
  },

  gameOver(win) {
    GameState.isRunning = false
    GameState.screen = 'result'
    GameState.isPaused = false
    GameState._lastWin = win
    // 최종 점수 확정
    if (window.ScoreSystem) {
      GameState.score = ScoreSystem.finalizeScore()
    }
    // 출시 포인트 적립
    if (window.MetaManager) {
      GameState.lastEarnedPoints = MetaManager.awardPoints()
    }
  },

  restart() {
    GameState.screen = 'lobby'
  },
}

// ─────────────────────────────────────────
// 게임 루프
// ─────────────────────────────────────────
let _lastTime = 0

function _loop(now) {
  let deltaTime = (now - _lastTime) / 1000
  _lastTime = now
  deltaTime = Math.min(deltaTime, 0.05)

  const gs = GameState
  const player = Game.player
  const ctx = Game.ctx

  // ── 로직 업데이트 (playing 상태일 때만) ──
  if (gs.screen === 'playing' && !gs.isPaused) {

    gs.gameTime += deltaTime

    if (player) {
      player.update(deltaTime, inputKeys)
      Game.enemySystem?.update(deltaTime)
      Game.skillManager?.update(deltaTime)

      // 출시 진행률 업데이트
      window.ScoreSystem?.updateReleaseProgress(deltaTime)

      // 충돌 감지
      for (const enemy of gs.enemies) {
        if (!enemy?.isAlive?.()) continue
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const hitR = (player.collisionRadius || 14) + (enemy.collisionRadius || 16)
        if (dist < hitR) {
          if (!(enemy._hitCooldown > 0)) {
            player.takeDamage(enemy.damage || 10)
            enemy._hitCooldown = 0.5
          }
        }
        if (enemy._hitCooldown > 0) enemy._hitCooldown -= deltaTime
      }

      gs.playerDanger = player.hp / player.maxHp < 0.3

      if (gs.aiBotIntro) {
        gs.aiBotIntroTimer += deltaTime
        if (gs.aiBotIntroTimer >= 0.5) gs.aiBotIntro = false
      }

      if (gs.gameTime >= 180) { Game.gameOver(true); return }
      if (!player.isAlive)    { Game.gameOver(false); return }
    }
  }

  // LevelUpManager 업데이트 (playing 중에만)
  if (gs.screen === 'playing' && !gs.isPaused) {
    window._levelUpManager?.update()
  }

  // ── 렌더링 ──
  ctx.clearRect(0, 0, 800, 600)
  drawBackground(ctx)

  if (gs.screen === 'lobby') {
    window._lobby?.render(ctx)

  } else if (gs.screen === 'result') {
    window._result?.render(ctx)

  } else if (gs.screen === 'upgrade') {
    window.MetaManager?.render(ctx)

  } else {
    // playing or paused
    // 적
    for (const enemy of gs.enemies) enemy?.render?.(ctx)
    // 스킬 이펙트
    Game.skillManager?.renderEffects?.(ctx, deltaTime)
    // 플레이어
    player?.render?.(ctx)
    // HUD
    window._hud?.render(ctx, gs.gameTime)
    // 레벨업 오버레이 (paused 포함)
    window._levelUpManager?.render(ctx)
    // AIBot 등장 연출
    if (gs.aiBotIntro) {
      const alpha = 1 - gs.aiBotIntroTimer / 0.5
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.85})`
      ctx.fillRect(0, 0, 800, 600)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#ff2222'
      ctx.font = 'bold 36px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('⚠ AI가 직접 나타났다', 400, 270)
      ctx.fillStyle = '#ffffff'
      ctx.font = '20px monospace'
      ctx.fillText('마지막 10초. 살아남아라.', 400, 315)
      ctx.restore()
    }
  }

  requestAnimationFrame(_loop)
}

// ─────────────────────────────────────────
// 부트스트랩
// ─────────────────────────────────────────
;(async () => {
  await tryImport('./entities/player.js')
  await tryImport('./entities/enemies.js')
  await tryImport('./entities/skills.js')
  await tryImport('./systems/spawner.js')
  await tryImport('./systems/levelup.js')
  await tryImport('./systems/score.js')
  await tryImport('./systems/meta.js')
  await tryImport('./ui/hud.js')
  await tryImport('./ui/lobby.js')
  await tryImport('./ui/result.js')

  // 모든 모듈 로드 완료 → gameReady 이벤트 발송
  window.dispatchEvent(new Event('gameReady'))

  Game.init()
})()
