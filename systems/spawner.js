// ============================================================
// spawner.js — M3: 스폰 타임라인 확장 (GDD Part 4.4)
// CartBot / PCBot / MirrorBot / AIBot 스폰 추가
// ErrorBullet / HazardZone 업데이트 & 렌더링 처리
// ============================================================

const SPAWN_TIMELINE = [
  { from: 0,   to: 30,  types: ['BoxBot'],                    interval: 2.5, maxEnemies: 5  },
  { from: 30,  to: 60,  types: ['BoxBot', 'CartBot'],         interval: 2.0, maxEnemies: 8  },
  { from: 60,  to: 100, types: ['CartBot', 'PCBot'],          interval: 1.8, maxEnemies: 10 },
  { from: 100, to: 130, types: ['CartBot', 'PCBot'],          interval: 1.5, maxEnemies: 12 },
  { from: 130, to: 155, types: ['MirrorBot', 'CartBot'],      interval: 2.0, maxEnemies: 8  },
  { from: 155, to: 170, types: ['MirrorBot', 'CartBot', 'PCBot'], interval: 2.0, maxEnemies: 10 },
]

class Spawner {
  constructor() {
    this.spawnTimer = 0
    this.aiBotSpawned = false
  }

  update(deltaTime) {
    if (!GameState.isRunning || GameState.isPaused) return

    const player = Game.player
    if (!player) return

    // hazardZones 배열 보장
    if (!GameState.hazardZones) GameState.hazardZones = []

    const t = GameState.gameTime
    const aliveCount = GameState.enemies.filter(e => e.isAlive()).length

    // ── 2:50 이후: AIBot 단독 등장 ──────────────────────────
    if (t >= 170) {
      if (!this.aiBotSpawned) {
        this.aiBotSpawned = true
        GameState.aiBotIntro = true
        GameState.aiBotIntroTimer = 0
        const pos = this._randomEdgePosition()
        GameState.enemies.push(new AIBot(pos.x, pos.y))
      }
    } else {
      // ── 일반 스폰 타임라인 ────────────────────────────────
      const phase = SPAWN_TIMELINE.find(p => t >= p.from && t < p.to)
      if (phase) {
        this.spawnTimer += deltaTime
        if (this.spawnTimer >= phase.interval && aliveCount < phase.maxEnemies) {
          this.spawnTimer = 0
          this._spawnEnemy(phase.types)
        }
      }
    }

    // ── 죽은 적 정리 & 업데이트 ──────────────────────────────
    GameState.enemies = GameState.enemies.filter(e => e.isAlive())
    for (const enemy of GameState.enemies) {
      enemy.update(deltaTime, player)
    }

    // ── 투사체 업데이트 & 정리 ───────────────────────────────
    GameState.projectiles = GameState.projectiles.filter(p => p.alive)
    for (const p of GameState.projectiles) {
      p.update(deltaTime, player)
    }

    // ── 방해 구역 업데이트 & 정리 ────────────────────────────
    GameState.hazardZones = GameState.hazardZones.filter(h => h.alive)
    for (const h of GameState.hazardZones) {
      h.update(deltaTime, player)
    }
  }

  _spawnEnemy(types) {
    const pos = this._randomEdgePosition()
    const type = types[Math.floor(Math.random() * types.length)]
    let enemy
    switch (type) {
      case 'BoxBot':    enemy = new BoxBot(pos.x, pos.y);    break
      case 'CartBot':   enemy = new CartBot(pos.x, pos.y);   break
      case 'PCBot':     enemy = new PCBot(pos.x, pos.y);     break
      case 'MirrorBot': enemy = new MirrorBot(pos.x, pos.y); break
      default:          enemy = new BoxBot(pos.x, pos.y)
    }
    GameState.enemies.push(enemy)
  }

  _randomEdgePosition() {
    const margin = 30
    const side = Math.floor(Math.random() * 4)
    switch (side) {
      case 0: return { x: Math.random() * 800, y: -margin }
      case 1: return { x: Math.random() * 800, y: 600 + margin }
      case 2: return { x: -margin, y: Math.random() * 600 }
      case 3: return { x: 800 + margin, y: Math.random() * 600 }
    }
  }

  // game.js의 렌더 루프에서 호출
  renderEnemies(ctx) {
    // 방해 구역 (바닥 레이어)
    if (GameState.hazardZones) {
      for (const h of GameState.hazardZones) h.render(ctx)
    }
    // 적
    for (const enemy of GameState.enemies) {
      enemy.render(ctx)
    }
    // 투사체 (상단 레이어)
    for (const p of GameState.projectiles) {
      p.render(ctx)
    }
  }
}

// 자동 등록
window.Spawner = Spawner
const _spawnerInstance = new Spawner()
if (window.Game) {
  Game.registerEnemySystem(_spawnerInstance)
} else {
  window.addEventListener('gameReady', () => {
    Game.registerEnemySystem(_spawnerInstance)
  })
}
