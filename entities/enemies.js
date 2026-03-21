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
    // 스프라이트 애니메이션 상태
    this._animTimer = 0
    this._animFrame = 0
    this._isMoving = false
    this._facingLeft = false
  }

  // 서브클래스 update() 후 호출 — 스프라이트 프레임 갱신
  _updateAnim(deltaTime, isMoving) {
    this._isMoving = isMoving
    const cfg = window.ENEMY_SPRITE_CONFIGS?.[this.constructor.name]
    if (!cfg) return
    const anim = isMoving ? cfg.walk : cfg.idle
    this._animTimer += deltaTime
    const frameDur = 1 / anim.fps
    if (this._animTimer >= frameDur) {
      this._animTimer -= frameDur
      this._animFrame = (this._animFrame + 1) % anim.frames
    }
  }

  // 스프라이트 렌더 시도 → 성공 시 true 반환
  _renderSprite(ctx) {
    const key = this.constructor.name
    const cfg = window.ENEMY_SPRITE_CONFIGS?.[key]
    const spr = window.ENEMY_SPRITES?.[key]
    if (!cfg || !spr) return false
    const anim = this._isMoving ? cfg.walk : cfg.idle
    const img  = this._isMoving ? spr.walk : spr.idle
    if (!img?.complete || img.naturalWidth === 0) return false

    const dw = anim.fw * cfg.scale
    const dh = anim.fh * cfg.scale
    const sx = this._animFrame * anim.fw
    const px = Math.round(this.x - dw / 2)
    const py = Math.round(this.y - dh * 0.75)

    ctx.save()
    if (this._facingLeft) {
      ctx.scale(-1, 1)
      ctx.translate(-2 * this.x, 0)
    }
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, sx, 0, anim.fw, anim.fh, px, py, dw, dh)
    ctx.imageSmoothingEnabled = true
    ctx.restore()
    return true
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
      this._facingLeft = dx < 0
    }
    this._updateAnim(deltaTime, dist > 1)
  }

  render(ctx) {
    if (!this.isAlive()) return
    if (this._renderSprite(ctx)) { _drawHpBar(ctx, this, 28); return }
    const x = this.x, y = this.y
    // 박스 본체
    ctx.fillStyle = '#C8AA7A'
    ctx.fillRect(x - 13, y - 13, 26, 22)
    ctx.strokeStyle = '#8B6914'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x - 13, y - 13, 26, 22)
    // 테이프 (수평/수직 크로스)
    ctx.strokeStyle = '#E8CC88'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x - 13, y - 2); ctx.lineTo(x + 13, y - 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.lineTo(x, y + 9); ctx.stroke()
    // 눈 (픽셀)
    const blink = Math.floor(Date.now() / 1200) % 8 !== 0
    ctx.fillStyle = '#1a1a1a'
    if (blink) {
      ctx.fillRect(x - 8, y - 10, 5, 4)
      ctx.fillRect(x + 3, y - 10, 5, 4)
    } else {
      ctx.fillRect(x - 8, y - 8, 5, 2)
      ctx.fillRect(x + 3, y - 8, 5, 2)
    }
    // 팔 (양 옆 작은 돌출)
    ctx.fillStyle = '#A88050'
    ctx.fillRect(x - 18, y - 5, 5, 8)
    ctx.fillRect(x + 13, y - 5, 5, 8)
    // 발
    ctx.fillRect(x - 10, y + 9, 7, 5)
    ctx.fillRect(x + 3, y + 9, 7, 5)
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
        this._facingLeft = dx < 0
      }
    }
    this._updateAnim(deltaTime, true)
  }

  render(ctx) {
    if (!this.isAlive()) return
    if (this._renderSprite(ctx)) { _drawHpBar(ctx, this, 32); return }
    const x = this.x, y = this.y
    const dash = this.isDashing
    ctx.save()
    if (dash) {
      ctx.shadowColor = '#FF6600'
      ctx.shadowBlur = 16
    }
    // 카트 바구니 (와이어 느낌)
    ctx.strokeStyle = dash ? '#FFAA44' : '#E8833A'
    ctx.lineWidth = 2.5
    ctx.strokeRect(x - 14, y - 8, 28, 18)
    // 카트 안쪽 격자
    ctx.lineWidth = 1
    ctx.strokeStyle = dash ? '#FF8822' : '#C06020'
    ctx.beginPath(); ctx.moveTo(x - 7, y - 8); ctx.lineTo(x - 7, y + 10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + 7, y - 8); ctx.lineTo(x + 7, y + 10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.lineTo(x + 14, y + 2); ctx.stroke()
    // 손잡이
    ctx.lineWidth = 2.5
    ctx.strokeStyle = dash ? '#FFCC44' : '#CC7730'
    ctx.beginPath(); ctx.moveTo(x - 10, y - 8); ctx.lineTo(x - 10, y - 16); ctx.lineTo(x + 10, y - 16); ctx.lineTo(x + 10, y - 8); ctx.stroke()
    // 바퀴
    ctx.fillStyle = '#222'
    ctx.beginPath(); ctx.arc(x - 9, y + 13, 5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 9, y + 13, 5, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(x - 9, y + 13, 5, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(x + 9, y + 13, 5, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
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

    this._facingLeft = (player.x - this.x) < 0
    this._updateAnim(deltaTime, true)
  }

  render(ctx) {
    if (!this.isAlive()) return
    if (this._renderSprite(ctx)) { _drawHpBar(ctx, this, 36); return }
    const x = this.x, y = this.y
    const t = Date.now()
    // 본체 (PC 타워)
    ctx.fillStyle = '#9A9A9A'
    ctx.fillRect(x - 10, y - 6, 20, 22)
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    ctx.strokeRect(x - 10, y - 6, 20, 22)
    // 드라이브 슬롯
    ctx.fillStyle = '#555'
    ctx.fillRect(x - 7, y, 14, 3)
    ctx.fillRect(x - 7, y + 5, 14, 3)
    // 전원 버튼 (깜빡임)
    ctx.fillStyle = Math.floor(t / 800) % 2 === 0 ? '#00FF44' : '#009922'
    ctx.beginPath(); ctx.arc(x + 5, y - 2, 2.5, 0, Math.PI * 2); ctx.fill()
    // CRT 모니터
    ctx.fillStyle = '#555'
    ctx.fillRect(x - 16, y - 32, 32, 24)
    ctx.fillStyle = '#111'
    ctx.fillRect(x - 14, y - 30, 28, 20)
    // 화면 (글리치 or 에러)
    const glitch = Math.floor(t / 200) % 10 === 0
    ctx.fillStyle = glitch ? '#FF2200' : '#003300'
    ctx.fillRect(x - 12, y - 28, 24, 16)
    // 코드 라인들
    ctx.fillStyle = glitch ? '#FF6644' : '#00CC44'
    ctx.fillRect(x - 10, y - 26, 14, 2)
    ctx.fillRect(x - 10, y - 22, 18, 2)
    ctx.fillRect(x - 10, y - 18, 10, 2)
    // 커서
    if (Math.floor(t / 500) % 2 === 0) {
      ctx.fillStyle = '#00FF88'
      ctx.fillRect(x - 2, y - 18, 3, 8)
    }
    // 모니터 받침
    ctx.fillStyle = '#666'
    ctx.fillRect(x - 4, y - 8, 8, 3)
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
    this._facingLeft = (player.x - this.x) < 0
    this._updateAnim(deltaTime, true)
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
    if (this._renderSprite(ctx)) { _drawHpBar(ctx, this, 32); return }
    const x = this.x, y = this.y
    const isDashing = this.dashPhase === 'dashing'
    ctx.save()
    // 돌진 잔상
    if (isDashing) {
      ctx.globalAlpha = 0.25
      ctx.fillStyle = '#C0C0FF'
      ctx.fillRect(x - 10 - 12, y - 9, 20, 30)
      ctx.globalAlpha = 0.12
      ctx.fillRect(x - 10 - 22, y - 9, 20, 30)
      ctx.globalAlpha = 1
      ctx.shadowColor = '#8888FF'
      ctx.shadowBlur = 18
    }
    // 다리
    ctx.fillStyle = isDashing ? '#E0E0FF' : '#A8A8B8'
    ctx.fillRect(x - 9, y + 11, 7, 13)
    ctx.fillRect(x + 2, y + 11, 7, 13)
    // 발 (약간 넓게)
    ctx.fillRect(x - 11, y + 21, 9, 4)
    ctx.fillRect(x + 2, y + 21, 9, 4)
    // 몸통
    ctx.fillStyle = isDashing ? '#E8E8FF' : '#C0C0C8'
    ctx.fillRect(x - 11, y - 10, 22, 22)
    // 몸통 하이라이트 (반사)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(x - 9, y - 8, 6, 18)
    // 머리
    ctx.fillStyle = isDashing ? '#E8E8FF' : '#C8C8D8'
    ctx.beginPath()
    ctx.arc(x, y - 19, 10, 0, Math.PI * 2)
    ctx.fill()
    // 머리 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.arc(x - 3, y - 22, 5, 0, Math.PI * 2)
    ctx.fill()
    // 눈
    ctx.fillStyle = isDashing ? '#FF3333' : '#6666FF'
    ctx.shadowColor = isDashing ? '#FF3333' : '#6666FF'
    ctx.shadowBlur = 8
    ctx.fillRect(x - 6, y - 23, 4, 4)
    ctx.fillRect(x + 2, y - 23, 4, 4)
    ctx.restore()
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

    this._facingLeft = (player.x - this.x) < 0
    this._updateAnim(deltaTime, true)
  }

  onKilled() {
    GameState.killCount++
    GameState.aiBotKilled = true
    GameState.score += this.scoreReward * 5
    GameState.playerExp += this.expReward
  }

  render(ctx) {
    if (!this.isAlive()) return
    if (this._renderSprite(ctx)) { _drawHpBar(ctx, this, 50); return }
    const x = this.x, y = this.y
    const halfHp = this.hp <= this.maxHp * 0.5
    const eyeColor = halfHp ? '#FF3C3C' : '#00FFFF'
    const t = Date.now()

    ctx.save()
    ctx.shadowColor = eyeColor
    ctx.shadowBlur = halfHp ? 30 : 20

    // 맥동 광환 (바깥)
    const pulse = 0.7 + 0.3 * Math.sin(t / 300)
    ctx.globalAlpha = 0.18 * pulse
    ctx.strokeStyle = eyeColor
    ctx.lineWidth = halfHp ? 5 : 3
    ctx.beginPath(); ctx.arc(x, y - 5, 42, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = 0.10 * pulse
    ctx.beginPath(); ctx.arc(x, y - 5, 54, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = 1

    // 다리
    ctx.fillStyle = '#111'
    ctx.fillRect(x - 14, y + 15, 11, 20)
    ctx.fillRect(x + 3, y + 15, 11, 20)
    // 발
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(x - 16, y + 31, 14, 5)
    ctx.fillRect(x + 2, y + 31, 14, 5)

    // 팔
    ctx.fillStyle = '#111'
    ctx.fillRect(x - 24, y - 12, 10, 26)
    ctx.fillRect(x + 14, y - 12, 10, 26)
    // 손 (클로)
    ctx.fillRect(x - 26, y + 10, 5, 8)
    ctx.fillRect(x - 22, y + 12, 5, 8)
    ctx.fillRect(x + 21, y + 10, 5, 8)
    ctx.fillRect(x + 17, y + 12, 5, 8)

    // 몸통
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(x - 15, y - 13, 30, 29)
    // 코어 (가슴)
    ctx.fillStyle = halfHp ? '#FF3C3C' : '#00FFFF'
    ctx.shadowBlur = 20
    ctx.beginPath(); ctx.arc(x, y + 2, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(x, y + 2, 2.5, 0, Math.PI * 2); ctx.fill()

    // 머리
    ctx.shadowBlur = 0
    ctx.fillStyle = '#111'
    ctx.beginPath(); ctx.arc(x, y - 26, 14, 0, Math.PI * 2); ctx.fill()

    // 눈
    ctx.fillStyle = eyeColor
    ctx.shadowColor = eyeColor
    ctx.shadowBlur = 16
    ctx.fillRect(x - 9, y - 30, 6, 5)
    ctx.fillRect(x + 3, y - 30, 6, 5)

    // HP 50% → 이마 금 균열
    if (halfHp) {
      ctx.strokeStyle = '#FF6644'
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.moveTo(x - 2, y - 37)
      ctx.lineTo(x + 1, y - 30)
      ctx.lineTo(x - 1, y - 24)
      ctx.stroke()
    }

    ctx.restore()

    // HP 바
    if (this.hp < this.maxHp) {
      const barW = 54
      ctx.fillStyle = '#222'
      ctx.fillRect(x - barW / 2, y - 52, barW, 6)
      ctx.fillStyle = halfHp ? '#FF3C3C' : '#00CCFF'
      ctx.fillRect(x - barW / 2, y - 52, barW * (this.hp / this.maxHp), 6)
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 1
      ctx.strokeRect(x - barW / 2, y - 52, barW, 6)
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
