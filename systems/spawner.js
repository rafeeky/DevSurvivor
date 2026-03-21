// ============================================================
// spawner.js — M3: 스폰 타임라인 확장 (GDD Part 4.4)
// 신규 적 첫 등장 알림 포함
// CartBot / PCBot / MirrorBot / AIBot 스폰 추가
// ErrorBullet / HazardZone 업데이트 & 렌더링 처리
// ============================================================

const ENEMY_INTRO_DATA = {
  'BoxBot':    { name: '박스봇',    desc: '기본 돌진형 • 직선으로 플레이어를 향해 돌진한다' },
  'CartBot':   { name: '카트봇',    desc: '신속형 • 카트를 몰아 빠르게 기동, 방향 전환 잦음' },
  'PCBot':     { name: 'PC봇',      desc: '원거리형 • 오류 투사체를 원거리에서 발사한다' },
  'MirrorBot': { name: '미러봇',    desc: '복사형 • 플레이어의 움직임 패턴을 그대로 흉내낸다' },
}

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
    this._announcedTypes = new Set()
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

    // 신규 적 유형 첫 등장 알림
    if (!this._announcedTypes.has(type)) {
      this._announcedTypes.add(type)
      const info = ENEMY_INTRO_DATA[type]
      if (info) {
        GameState.enemyAnnouncement = { name: info.name, desc: info.desc, timer: 3.2, maxTimer: 3.2 }
      }
    }
  }

  _randomEdgePosition() {
    const margin = 40
    const camX = window.Camera?.x || 0
    const camY = window.Camera?.y || 0
    const WW = window.WORLD_W || 800
    const WH = window.WORLD_H || 600
    const side = Math.floor(Math.random() * 4)
    let x, y
    switch (side) {
      case 0: x = camX + Math.random() * 800; y = camY - margin; break          // 위
      case 1: x = camX + Math.random() * 800; y = camY + 600 + margin; break    // 아래
      case 2: x = camX - margin; y = camY + Math.random() * 600; break          // 왼쪽
      default: x = camX + 800 + margin; y = camY + Math.random() * 600; break   // 오른쪽
    }
    // 월드 경계 클램프
    x = Math.max(40, Math.min(WW - 40, x))
    y = Math.max(40, Math.min(WH - 40, y))
    return { x, y }
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
