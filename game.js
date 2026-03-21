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
  enemyAnnouncement: null,
  // 메타 업그레이드 배율 (MetaManager.applyToPlayer 에서 설정)
  skillDamageMult: 1,
  expMultiplier:   1,
  healMultiplier:  1,
  lastEarnedPoints: 0,
  // 캐릭터 선택 (lobby에서 설정, 게임 재시작 시 유지)
  selectedCharacter: localStorage.getItem('devSurvivor_char') || 'adam',
}

// 메타 매니저 초기화 (GameState 정의 직후)
if (window.MetaManager) MetaManager.initUnlockedChars()

// ─────────────────────────────────────────
// 키 입력
// ─────────────────────────────────────────
const inputKeys = {}
window.inputKeys = inputKeys

window.addEventListener('keydown', e => {
  inputKeys[e.code] = true
  if (
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code) &&
    GameState.screen === 'playing' &&
    !GameState.isPaused &&
    !window._levelUpManager?.pendingLevelUp
  ) {
    const slot = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code)
    Game.skillManager?.activateSkill(slot)
  }
})
window.addEventListener('keyup', e => { inputKeys[e.code] = false })

// ─────────────────────────────────────────
// 카메라 시스템
// ─────────────────────────────────────────
window.Camera = { x: 0, y: 0 }

function updateCamera(player) {
  if (!player) return
  const WW = window.WORLD_W || 800
  const WH = window.WORLD_H || 600
  Camera.x = Math.max(0, Math.min(WW - 800, player.x - 400))
  Camera.y = Math.max(0, Math.min(WH - 600, player.y - 300))
}

// ─────────────────────────────────────────
// 적 등장 알림 렌더링
// ─────────────────────────────────────────
function _drawEnemyAnnouncement(ctx, ann) {
  const elapsed = ann.maxTimer - ann.timer
  let alpha
  if (elapsed < 0.3) alpha = elapsed / 0.3
  else if (ann.timer < 0.6) alpha = ann.timer / 0.6
  else alpha = 1

  ctx.save()
  ctx.globalAlpha = alpha

  // 배너 배경
  ctx.fillStyle = 'rgba(12, 4, 28, 0.9)'
  ctx.fillRect(140, 72, 520, 100)
  ctx.strokeStyle = '#cc2222'
  ctx.lineWidth = 2
  ctx.strokeRect(140, 72, 520, 100)

  // 레이블
  ctx.fillStyle = '#ff6644'
  ctx.font = '22px "VT323", cursive'
  ctx.textAlign = 'center'
  ctx.fillText('⚠  신규 적 등장  ⚠', 400, 94)

  // 적 이름
  ctx.fillStyle = '#ff3333'
  ctx.font = 'bold 38px "VT323", cursive'
  ctx.fillText(ann.name, 400, 130)

  // 설명
  ctx.fillStyle = '#ddbbaa'
  ctx.font = '20px "VT323", cursive'
  ctx.fillText(ann.desc, 400, 158)

  ctx.restore()
}

// ─────────────────────────────────────────
// 캐릭터 패시브 적용
// ─────────────────────────────────────────
function _applyCharacterPassive(player, skillManager) {
  const charKey = GameState.selectedCharacter || 'adam'
  if (charKey === 'adam') {
    // 속도형 / 빠른 적응: 경험치 +20%, 이동속도 +20
    player._charPassive = 'speed'
    GameState.expMultiplier = (GameState.expMultiplier || 1) + 0.2
    player.baseSpeed += 20
  } else if (charKey === 'alex') {
    // 처리형 / 숙련된 디버깅: 스킬 데미지 +20%, 디버그 쿨다운 -0.5초
    player._charPassive = 'combat'
    GameState.skillDamageMult = (GameState.skillDamageMult || 1) + 0.2
    if (skillManager?.skillDefs?.['디버그']) {
      skillManager.skillDefs['디버그'].cooldown = Math.max(0.5, skillManager.skillDefs['디버그'].cooldown - 0.5)
    }
  } else if (charKey === 'amelia') {
    // 버티기형 / 끝까지 버티기: 회복량 +25%, 보호막 +1, 저체력 피해 -20%(takeDamage에서 처리)
    player._charPassive = 'survivor'
    GameState.healMultiplier = (GameState.healMultiplier || 1) + 0.25
    player.addShield(1)
  }
}

// ─────────────────────────────────────────
// 배경 렌더링
// ─────────────────────────────────────────
function drawBackground(ctx) {
  if (window.TilemapSystem) {
    window.TilemapSystem.render(ctx, Camera.x, Camera.y)
  } else {
    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, 800, 600)
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
      enemyAnnouncement: null,
    })

    // 카메라 초기화
    if (window.Camera) { Camera.x = 0; Camera.y = 0 }

    // 플레이어 생성 (월드 중앙 근처)
    if (window.Player) {
      Game.player = new window.Player(1200, 900)
      // skills.js가 playerCreated 이벤트를 듣고 SkillManager를 등록
      window.dispatchEvent(new CustomEvent('playerCreated', { detail: { player: Game.player } }))
      // 메타 업그레이드 효과 적용
      if (window.MetaManager) MetaManager.applyToPlayer(Game.player, Game.skillManager)
      // 캐릭터 고유 패시브 적용 (메타 이후에 적용해 수치 누적)
      _applyCharacterPassive(Game.player, Game.skillManager)
      // 시작 스킬 없으면 디버그 무료 지급
      if (Game.skillManager && !Game.skillManager.slots.some(Boolean)) {
        Game.skillManager.assignSkill(0, '디버그')
      }
    }

    // 골드 드롭 리셋
    window.dropManager?.reset()
    GameState.goldInventory = { 1: 0, 2: 0, 3: 0, 4: 0 }

    // Spawner 리셋
    if (Game.enemySystem) {
      Game.enemySystem.spawnTimer = 0
      Game.enemySystem.aiBotSpawned = false
      Game.enemySystem._announcedTypes = new Set()
    }

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
      updateCamera(player)
      Game.enemySystem?.update(deltaTime)
      Game.skillManager?.update(deltaTime)
      window.dropManager?.update(deltaTime, player)

      // gold_4 픽업 → 뱀파이어 해금 체크
      if (gs.lastPickedGold === 4) {
        gs.lastPickedGold = null
        if (window.MetaManager && !MetaManager.isUnlocked('vampir')) {
          MetaManager.unlockChar('vampir')
          gs.unlockedChars = gs.unlockedChars || {}
          gs.unlockedChars.vampir = true
          // 해금 알림 표시
          gs.unlockNotification = { msg: '뱀파이어 개발자 해금!', timer: 3.0 }
        }
      }

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

      if (gs.enemyAnnouncement?.timer > 0) {
        gs.enemyAnnouncement.timer -= deltaTime
      }

      if (gs.gameTime >= 180)  Game.gameOver(true)
      else if (!player.isAlive) Game.gameOver(false)
    }
  }

  // LevelUpManager 업데이트 (playing 중에만)
  if (gs.screen === 'playing' && !gs.isPaused) {
    window._levelUpManager?.update()
  }

  // ── 렌더링 ──
  ctx.clearRect(0, 0, 800, 600)

  if (gs.screen === 'lobby') {
    drawBackground(ctx)
    window._lobby?.render(ctx)

  } else if (gs.screen === 'result') {
    window._result?.render(ctx)

  } else if (gs.screen === 'upgrade') {
    window.MetaManager?.render(ctx)

  } else {
    // playing or paused — 월드 공간은 카메라 오프셋 적용
    drawBackground(ctx)

    // 월드 공간 렌더: ctx를 카메라만큼 이동
    ctx.save()
    ctx.translate(-Camera.x, -Camera.y)

    // 적 + 투사체 + 방해 구역
    Game.enemySystem?.renderEnemies?.(ctx)
    // 골드 드롭 아이템 (플레이어 아래 레이어)
    window.dropManager?.render(ctx)
    // 스킬 이펙트
    Game.skillManager?.renderEffects?.(ctx, deltaTime)
    // 플레이어
    player?.render?.(ctx)

    ctx.restore()

    // 스크린 공간 렌더 (HUD 등 카메라 영향 없음)
    window._hud?.render(ctx, gs.gameTime)
    // 레벨업 오버레이 (paused 포함)
    window._levelUpManager?.render(ctx)
    // 모바일 조이스틱
    window._joystick?.render(ctx)
    // 신규 적 등장 알림
    if (gs.enemyAnnouncement?.timer > 0) {
      _drawEnemyAnnouncement(ctx, gs.enemyAnnouncement)
    }

    // AIBot 등장 연출
    if (gs.aiBotIntro) {
      const alpha = 1 - gs.aiBotIntroTimer / 0.5
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.85})`
      ctx.fillRect(0, 0, 800, 600)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#ff2222'
      ctx.font = 'bold 48px "VT323", cursive'
      ctx.textAlign = 'center'
      ctx.fillText('⚠ AI가 직접 나타났다', 400, 270)
      ctx.fillStyle = '#ffffff'
      ctx.font = '28px "VT323", cursive'
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
  await tryImport('./entities/charsprites.js')
  await tryImport('./entities/enemysprites.js')
  await tryImport('./entities/player.js')
  await tryImport('./entities/enemies.js')
  await tryImport('./entities/skills.js')
  await tryImport('./systems/tilemap.js')
  await tryImport('./systems/spawner.js')
  await tryImport('./systems/levelup.js')
  await tryImport('./systems/score.js')
  await tryImport('./systems/meta.js')
  await tryImport('./ui/hud.js')
  await tryImport('./ui/lobby.js')
  await tryImport('./ui/result.js')
  await tryImport('./ui/joystick.js')

  // 모든 모듈 로드 완료 → gameReady 이벤트 발송
  window.dispatchEvent(new Event('gameReady'))

  Game.init()
})()
