// ============================================================
// enemies.js — M3: CartBot, PCBot, MirrorBot, AIBot 추가
// GDD Part 4 기준
// ============================================================

// 공통 HP 바 헬퍼
function _drawHpBar(ctx, enemy, barW) {
  if (enemy.hp >= enemy.maxHp) return
  ctx.fillStyle = '#444'
  ctx.fillRect(enemy.x - barW / 2, enemy.y - 22, barW, 4)
  ctx.fillStyle = '#ff4444'
  ctx.fillRect(enemy.x - barW / 2, enemy.y - 22, barW * (enemy.hp / enemy.maxHp), 4)
}

// ============================================================
// Enemy 베이스 클래스
// ============================================================
class Enemy {
  constructor(x, y, config) {
    this.x = x
    this.y = y
    this.hp = config.hp
    this.maxHp = config.hp
    this.speed = config.speed
    this.damage = config.damage
    this.expReward = config.expReward
    this.scoreReward = config.scoreReward || config.expReward
    this.collisionRadius = config.collisionRadius || 16
    this.collisionCooldown = 0
    this.alive = true
  }

  isAlive() { return this.alive && this.hp > 0 }

  takeDamage(amount) {
    this.hp -= amount
    if (this.hp <= 0) {
      this.hp = 0
      this.alive = false
      this.onKilled()
    }
  }

  onKilled() {
    GameState.killCount++
    GameState.basicKills++
    GameState.score += this.scoreReward * 5
    GameState.playerExp += Math.floor(this.expReward * (GameState.expMultiplier || 1))
  }

  update(deltaTime, player) { /* 서브클래스에서 구현 */ }
  render(ctx) { /* 서브클래스에서 구현 */ }
}

// ============================================================
// BoxBot — HP 30, 속도 80, 직진형
// ============================================================
class BoxBot extends Enemy {
  constructor(x, y) {
    super(x, y, {
      hp: 30, speed: 80, damage: 10,
      expReward: 5, scoreReward: 5,
      collisionRadius: 14,
    })
  }

  update(deltaTime, player) {
    if (!this.isAlive()) return
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * deltaTime
      this.y += (dy / dist) * this.speed * deltaTime
    }
  }

  render(ctx) {
    if (!this.isAlive()) return
    ctx.fillStyle = '#C4A882'
    ctx.fillRect(this.x - 12, this.y - 14, 24, 20)
    ctx.fillStyle = '#333'
    ctx.fillRect(this.x - 7, this.y - 11, 5, 4)
    ctx.fillRect(this.x + 2, this.y - 11, 5, 4)
    ctx.fillStyle = '#A08060'
    ctx.fillRect(this.x - 9, this.y + 6, 7, 8)
    ctx.fillRect(this.x + 2, this.y + 6, 7, 8)
    _drawHpBar(ctx, this, 28)
  }
}

// ============================================================
// CartBot — HP 55, 속도 130, 3초마다 돌진
// ============================================================
class CartBot extends Enemy {
  constructor(x, y) {
    super(x, y, {
      hp: 55, speed: 130, damage: 15,
      expReward: 10, scoreReward: 10,
      collisionRadius: 16,
    })
    this.dashTimer = 0
    this.dashCooldown = 3.0
    this.isDashing = false
    this.dashDuration = 0
    this.dashDx = 0
    this.dashDy = 0
  }

  update(deltaTime, player) {
    if (!this.isAlive()) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    this.dashTimer += deltaTime

    if (!this.isDashing && this.dashTimer >= this.dashCooldown) {
      this.isDashing = true
      this.dashTimer = 0
      this.dashDuration = 0
      if (dist > 0) {
        this.dashDx = dx / dist
        this.dashDy = dy / dist
      }
    }

    if (this.isDashing) {
      this.dashDuration += deltaTime
      this.x += this.dashDx * this.speed * 2 * deltaTime
      this.y += this.dashDy * this.speed * 2 * deltaTime
      if (this.dashDuration >= 0.6) {
        this.isDashing = false
        this.dashDuration = 0
      }
    } else {
      if (dist > 0) {
        this.x += (dx / dist) * this.speed * deltaTime
        this.y += (dy / dist) * this.speed * deltaTime
      }
    }
  }

  render(ctx) {
    if (!this.isAlive()) return
    ctx.fillStyle = this.isDashing ? '#FF9944' : '#E8833A'
    ctx.fillRect(this.x - 14, this.y - 14, 28, 20)
    // 화면
    ctx.fillStyle = '#222'
    ctx.fillRect(this.x - 10, this.y - 11, 20, 10)
    ctx.fillStyle = '#00FF88'
    ctx.fillRect(this.x - 8, this.y - 9, 16, 6)
    // 바퀴
    ctx.fillStyle = '#333'
    ctx.beginPath(); ctx.arc(this.x - 8, this.y + 9, 5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(this.x + 8, this.y + 9, 5, 0, Math.PI * 2); ctx.fill()
    _drawHpBar(ctx, this, 32)
  }
}

// ============================================================
// PCBot — HP 80, 속도 70, 원거리 유지, 오류탄, 방해 구역
// ============================================================
class PCBot extends Enemy {
  constructor(x, y) {
    super(x, y, {
      hp: 80, speed: 70, damage: 12,
      expReward: 15, scoreReward: 15,
      collisionRadius: 18,
    })
    this.shootTimer = 0
    this.shootInterval = 2.5
    this.hazardTimer = 0
    this.hazardInterval = 6.0
    this.preferredMin = 150
    this.preferredMax = 250
  }

  update(deltaTime, player) {
    if (!this.isAlive()) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 거리 유지 이동
    if (dist > 0) {
      if (dist < this.preferredMin) {
        this.x -= (dx / dist) * this.speed * deltaTime
        this.y -= (dy / dist) * this.speed * deltaTime
      } else if (dist > this.preferredMax) {
        this.x += (dx / dist) * this.speed * deltaTime
        this.y += (dy / dist) * this.speed * deltaTime
      }
    }

    // 오류탄 발사
    this.shootTimer += deltaTime
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0
      GameState.projectiles.push(new ErrorBullet(this.x, this.y, player.x, player.y))
    }

    // 방해 구역 생성
    this.hazardTimer += deltaTime
    if (this.hazardTimer >= this.hazardInterval) {
      this.hazardTimer = 0
      if (!GameState.hazardZones) GameState.hazardZones = []
      GameState.hazardZones.push(new HazardZone(this.x, this.y))
    }
  }

  render(ctx) {
    if (!this.isAlive()) return
    // 본체
    ctx.fillStyle = '#888888'
    ctx.fillRect(this.x - 16, this.y - 10, 32, 22)
    // 모니터
    ctx.fillStyle = '#222'
    ctx.fillRect(this.x - 12, this.y - 22, 24, 16)
    ctx.fillStyle = '#00AA55'
    ctx.fillRect(this.x - 10, this.y - 20, 20, 10)
    // 깜박이는 커서
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = '#00FF88'
      ctx.fillRect(this.x - 1, this.y - 16, 2, 6)
    }
    _drawHpBar(ctx, this, 36)
  }
}

// ============================================================
// MirrorBot — HP 150, 속도 170, 예측 추적, 연속 돌진 3회
// ============================================================
class MirrorBot extends Enemy {
  constructor(x, y) {
    super(x, y, {
      hp: 150, speed: 170, damage: 25,
      expReward: 30, scoreReward: 30,
      collisionRadius: 15,
    })
    this.dashPhase = 'idle'   // 'idle' | 'dashing' | 'gap'
    this.dashCycleTimer = 0
    this.dashCycleInterval = 4.0
    this.dashCount = 0
    this.dashDuration = 0
    this.dashGapTimer = 0
    this.dashDx = 0
    this.dashDy = 0
    this.prevPlayerX = null
    this.prevPlayerY = null
  }

  update(deltaTime, player) {
    if (!this.isAlive()) return

    // 첫 프레임 초기화
    if (this.prevPlayerX === null) {
      this.prevPlayerX = player.x
      this.prevPlayerY = player.y
    }

    if (this.dashPhase === 'idle') {
      // 예측 이동: 플레이어 속도 추정 → 0.25초 후 위치 예측
      const pvx = (player.x - this.prevPlayerX) / Math.max(deltaTime, 0.001)
      const pvy = (player.y - this.prevPlayerY) / Math.max(deltaTime, 0.001)
      const clampedVx = Math.max(-500, Math.min(500, pvx))
      const clampedVy = Math.max(-500, Math.min(500, pvy))
      const targetX = player.x + clampedVx * 0.25
      const targetY = player.y + clampedVy * 0.25

      const dx = targetX - this.x
      const dy = targetY - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0) {
        this.x += (dx / dist) * this.speed * deltaTime
        this.y += (dy / dist) * this.speed * deltaTime
      }

      this.dashCycleTimer += deltaTime
      if (this.dashCycleTimer >= this.dashCycleInterval) {
        this.dashCycleTimer = 0
        this.dashPhase = 'dashing'
        this.dashCount = 0
        this.dashDuration = 0
        this._startDash(player)
      }

    } else if (this.dashPhase === 'dashing') {
      this.dashDuration += deltaTime
      this.x += this.dashDx * this.speed * 2.5 * deltaTime
      this.y += this.dashDy * this.speed * 2.5 * deltaTime
      if (this.dashDuration >= 0.3) {
        this.dashDuration = 0
        this.dashCount++
        if (this.dashCount < 3) {
          this.dashPhase = 'gap'
          this.dashGapTimer = 0
        } else {
          this.dashPhase = 'idle'
        }
      }

    } else if (this.dashPhase === 'gap') {
      this.dashGapTimer += deltaTime
      if (this.dashGapTimer >= 0.2) {
        this.dashPhase = 'dashing'
        this.dashDuration = 0
        this._startDash(player)
      }
    }

    this.prevPlayerX = player.x
    this.prevPlayerY = player.y
  }

  _startDash(player) {
    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0) {
      this.dashDx = dx / dist
      this.dashDy = dy / dist
    }
  }

  onKilled() {
    GameState.killCount++
    GameState.mirrorBotKills = (GameState.mirrorBotKills || 0) + 1
    GameState.score += this.scoreReward * 5
    GameState.playerExp += this.expReward
  }

  render(ctx) {
    if (!this.isAlive()) return
    const isDashing = this.dashPhase === 'dashing'
    ctx.fillStyle = isDashing ? '#E8E8FF' : '#C0C0C0'
    // 머리
    ctx.beginPath()
    ctx.arc(this.x, this.y - 18, 9, 0, Math.PI * 2)
    ctx.fill()
    // 몸통
    ctx.fillRect(this.x - 10, this.y - 9, 20, 20)
    // 다리
    ctx.fillRect(this.x - 9, this.y + 11, 7, 11)
    ctx.fillRect(this.x + 2, this.y + 11, 7, 11)
    // 발광 눈
    ctx.fillStyle = isDashing ? '#FF4444' : '#8888FF'
    ctx.fillRect(this.x - 6, this.y - 22, 4, 3)
    ctx.fillRect(this.x + 2, this.y - 22, 4, 3)
    _drawHpBar(ctx, this, 32)
  }
}

// ============================================================
// AIBot — HP 600, 속도 200, 보스, 충격파, 카트봇 소환
// ============================================================
class AIBot extends Enemy {
  constructor(x, y) {
    super(x, y, {
      hp: 600, speed: 200, damage: 35,
      expReward: 200, scoreReward: 200,
      collisionRadius: 25,
    })
    this.dashTimer = 0
    this.dashInterval = 5.0
    this.isDashing = false
    this.dashDuration = 0
    this.dashDx = 0
    this.dashDy = 0

    this.shockwaveTimer = 0
    this.shockwaveInterval = 8.0

    this.summonTimer = 0
    this.summonInterval = 20.0
    this.hasSummonedOnHalf = false

    // 등장 이벤트
    GameState.aiBotReached = true
  }

  update(deltaTime, player) {
    if (!this.isAlive()) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 돌진
    this.dashTimer += deltaTime
    if (!this.isDashing && this.dashTimer >= this.dashInterval) {
      this.isDashing = true
      this.dashTimer = 0
      this.dashDuration = 0
      if (dist > 0) {
        this.dashDx = dx / dist
        this.dashDy = dy / dist
      }
    }

    if (this.isDashing) {
      this.dashDuration += deltaTime
      this.x += this.dashDx * this.speed * 3 * deltaTime
      this.y += this.dashDy * this.speed * 3 * deltaTime
      if (this.dashDuration >= 0.8) this.isDashing = false
    } else {
      if (dist > 0) {
        this.x += (dx / dist) * this.speed * deltaTime
        this.y += (dy / dist) * this.speed * deltaTime
      }
    }

    // 충격파 (8초마다, 200px 이내)
    this.shockwaveTimer += deltaTime
    if (this.shockwaveTimer >= this.shockwaveInterval) {
      this.shockwaveTimer = 0
      if (dist < 200) {
        player.takeDamage(40)
        // 넉백: 플레이어를 AIBot 반대 방향으로 120px
        if (dist > 0) {
          const nx = dx / dist
          const ny = dy / dist
          player.x = Math.max(20, Math.min(780, player.x + nx * 120))
          player.y = Math.max(20, Math.min(580, player.y + ny * 120))
        }
      }
    }

    // HP 50% 이하 — 카트봇 소환 (20초마다)
    if (this.hp <= this.maxHp * 0.5) {
      this.summonTimer += deltaTime
      if (this.summonTimer >= this.summonInterval) {
        this.summonTimer = 0
        const offsets = [
          { x: this.x + 120, y: this.y + 80 },
          { x: this.x - 120, y: this.y - 80 },
        ]
        for (const pos of offsets) {
          GameState.enemies.push(new CartBot(
            Math.max(20, Math.min(780, pos.x)),
            Math.max(20, Math.min(580, pos.y))
          ))
        }
      }
    }
  }

  onKilled() {
    GameState.killCount++
    GameState.aiBotKilled = true
    GameState.score += this.scoreReward * 5
    GameState.playerExp += this.expReward
  }

  render(ctx) {
    if (!this.isAlive()) return
    const halfHp = this.hp <= this.maxHp * 0.5

    // 몸통 (인간형)
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(this.x, this.y - 26, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(this.x - 15, this.y - 13, 30, 28)
    ctx.fillRect(this.x - 13, this.y + 15, 10, 18)
    ctx.fillRect(this.x + 3, this.y + 15, 10, 18)

    // 발광 눈 (청색)
    ctx.save()
    ctx.fillStyle = halfHp ? '#FF3C3C' : '#00FFFF'
    ctx.shadowColor = halfHp ? '#FF3C3C' : '#00FFFF'
    ctx.shadowBlur = 14
    ctx.fillRect(this.x - 8, this.y - 30, 5, 4)
    ctx.fillRect(this.x + 3, this.y - 30, 5, 4)
    ctx.restore()

    // HP 50% 이하 — 붉은 광환
    if (halfHp) {
      ctx.save()
      ctx.strokeStyle = '#FF3C3C'
      ctx.shadowColor = '#FF3C3C'
      ctx.shadowBlur = 20
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(this.x, this.y - 5, 32, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    // HP 바
    if (this.hp < this.maxHp) {
      const barW = 50
      ctx.fillStyle = '#444'
      ctx.fillRect(this.x - barW / 2, this.y - 48, barW, 5)
      ctx.fillStyle = halfHp ? '#FF3C3C' : '#ff4444'
      ctx.fillRect(this.x - barW / 2, this.y - 48, barW * (this.hp / this.maxHp), 5)
    }
  }
}

// ============================================================
// ErrorBullet — PCBot 오류탄
// ============================================================
class ErrorBullet {
  constructor(x, y, tx, ty) {
    this.x = x
    this.y = y
    const dx = tx - x
    const dy = ty - y
    const d = Math.sqrt(dx * dx + dy * dy) || 1
    this.vx = (dx / d) * 80
    this.vy = (dy / d) * 80
    this.alive = true
    this.radius = 6
  }

  update(deltaTime, player) {
    this.x += this.vx * deltaTime
    this.y += this.vy * deltaTime

    // 화면 밖 제거
    if (this.x < -60 || this.x > 860 || this.y < -60 || this.y > 660) {
      this.alive = false
      return
    }

    // 플레이어 충돌
    const dx = player.x - this.x
    const dy = player.y - this.y
    const pRadius = player.collisionRadius || 15
    if (Math.sqrt(dx * dx + dy * dy) < this.radius + pRadius) {
      this.alive = false
      if (player.applyBuff) player.applyBuff('speed', 0.7, 2)
    }
  }

  render(ctx) {
    ctx.save()
    ctx.fillStyle = '#FF4444'
    ctx.shadowColor = '#FF0000'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ============================================================
// HazardZone — PCBot 방해 구역 (반경 80px, 4초 지속)
// ============================================================
class HazardZone {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.radius = 80
    this.duration = 4.0
    this.elapsed = 0
    this.alive = true
    this.damageCooldown = 0
  }

  update(deltaTime, player) {
    this.elapsed += deltaTime
    this.damageCooldown -= deltaTime

    if (this.elapsed >= this.duration) {
      this.alive = false
      return
    }

    const dx = player.x - this.x
    const dy = player.y - this.y
    if (Math.sqrt(dx * dx + dy * dy) < this.radius && this.damageCooldown <= 0) {
      player.takeDamage(8)
      this.damageCooldown = 0.5
    }
  }

  render(ctx) {
    const fade = 1 - this.elapsed / this.duration
    ctx.save()
    ctx.globalAlpha = fade * 0.30
    ctx.fillStyle = '#FF3300'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = fade * 0.65
    ctx.strokeStyle = '#FF6600'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }
}

// ============================================================
// 전역 노출
// ============================================================
window.Enemy = Enemy
window.BoxBot = BoxBot
window.CartBot = CartBot
window.PCBot = PCBot
window.MirrorBot = MirrorBot
window.AIBot = AIBot
window.ErrorBullet = ErrorBullet
window.HazardZone = HazardZone
window.EnemyRegistry = { BoxBot, CartBot, PCBot, MirrorBot, AIBot }
