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

    const dw = Math.round(anim.fw * cfg.scale)
    const dh = Math.round(anim.fh * cfg.scale)
    const sx = this._animFrame * anim.fw
    const px = Math.round(this.x - dw / 2)
    const py = Math.round(this.y - dh * 0.75)

    ctx.save()
    if (this._facingLeft) {
      ctx.scale(-1, 1)
      ctx.translate(-2 * this.x, 0)
    }
    ctx.beginPath()
    ctx.rect(px, py, dw, dh)
    ctx.clip()
    const needsSmoothing = anim.fw > 64
    ctx.imageSmoothingEnabled = needsSmoothing
    if (needsSmoothing) ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, 0, anim.fw, anim.fh, px, py, dw, dh)
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
    if (window.dropManager) {
      const dropType = window.dropManager.getDropTypeForEnemy(this.constructor.name)
      window.dropManager.spawnDrop(this.x, this.y, dropType)
    }
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
// CartBot — 블루패치 HP 55, 속도 130, 갑작스런 빠른 돌진
// ============================================================
class CartBot extends Enemy {
  constructor(x, y) {
    super(x, y, {
      hp: 55, speed: 130, damage: 15,
      expReward: 10, scoreReward: 10,
      collisionRadius: 16,
    })
    this.dashTimer = 0
    this.dashCooldown = 2.5
    this.isDashing = false
    this.dashDuration = 0
    this.dashDx = 0
    this.dashDy = 0
    this._dashWarnTimer = 0
    this._dashWarning = false
  }

  update(deltaTime, player) {
    if (!this.isAlive()) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    this.dashTimer += deltaTime

    // 돌진 0.3초 전 경고 깜빡임
    if (!this.isDashing && this.dashTimer >= this.dashCooldown - 0.3) {
      this._dashWarning = true
    }

    if (!this.isDashing && this.dashTimer >= this.dashCooldown) {
      this.isDashing = true
      this._dashWarning = false
      this.dashTimer = 0
      this.dashDuration = 0
      if (dist > 0) {
        this.dashDx = dx / dist
        this.dashDy = dy / dist
      }
    }

    if (this.isDashing) {
      this.dashDuration += deltaTime
      this.x += this.dashDx * this.speed * 2.8 * deltaTime
      this.y += this.dashDy * this.speed * 2.8 * deltaTime
      if (this.dashDuration >= 0.5) {
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
    if (this._renderSprite(ctx)) {
      // 돌진 경고 표시
      if (this._dashWarning && !this.isDashing) {
        const blink = Math.floor(Date.now() / 120) % 2 === 0
        if (blink) {
          ctx.save()
          ctx.strokeStyle = '#ff4400'
          ctx.lineWidth = 2
          ctx.shadowColor = '#ff4400'
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(this.x, this.y, 22, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      }
      _drawHpBar(ctx, this, 32); return
    }
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
// PCBot — 모니터헤드 HP 80, 속도 70, 원거리, 스캔 빔, 방해 구역
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
    // 스캔 빔
    this.scanTimer = 0
    this.scanInterval = 5.0
    this.scanBeam = null   // { tx, ty, life, maxLife }
  }

  onKilled() {
    GameState.killCount++
    GameState.pcBotKills = (GameState.pcBotKills || 0) + 1
    GameState.score += this.scoreReward * 5
    GameState.playerExp += Math.floor(this.expReward * (GameState.expMultiplier || 1))
    if (window.dropManager) {
      const dropType = window.dropManager.getDropTypeForEnemy(this.constructor.name)
      window.dropManager.spawnDrop(this.x, this.y, dropType)
    }
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

    // 스캔 빔 (5초마다 플레이어에게 레이저 조사 → 2초 지속 → 데미지)
    this.scanTimer += deltaTime
    if (this.scanTimer >= this.scanInterval) {
      this.scanTimer = 0
      this.scanBeam = { tx: player.x, ty: player.y, life: 2.0, maxLife: 2.0 }
    }
    if (this.scanBeam) {
      this.scanBeam.life -= deltaTime
      // 빔 지속 중 플레이어가 빔 선 위에 있으면 데미지
      if (this.scanBeam.life > 0) {
        const bx = this.scanBeam.tx - this.x
        const by = this.scanBeam.ty - this.y
        const bLen = Math.sqrt(bx * bx + by * by) || 1
        const px2 = player.x - this.x
        const py2 = player.y - this.y
        const proj = (px2 * bx + py2 * by) / (bLen * bLen)
        const clampedProj = Math.max(0, Math.min(1, proj))
        const closestX = this.x + clampedProj * bx
        const closestY = this.y + clampedProj * by
        const beamDist = Math.sqrt((player.x - closestX) ** 2 + (player.y - closestY) ** 2)
        if (beamDist < 14 && !(this._beamDamageCooldown > 0)) {
          player.takeDamage(8)
          this._beamDamageCooldown = 0.4
        }
      } else {
        this.scanBeam = null
      }
    }
    if (this._beamDamageCooldown > 0) this._beamDamageCooldown -= deltaTime

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
    // 스캔 빔 렌더 (스프라이트 아래 레이어)
    if (this.scanBeam && this.scanBeam.life > 0) {
      const alpha = Math.min(1, this.scanBeam.life / 0.4) * 0.85
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#00ffcc'
      ctx.lineWidth = 3
      ctx.shadowColor = '#00ffcc'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(this.scanBeam.tx, this.scanBeam.ty)
      ctx.stroke()
      // 빔 끝 점
      ctx.fillStyle = '#00ffcc'
      ctx.beginPath()
      ctx.arc(this.scanBeam.tx, this.scanBeam.ty, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
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
// MirrorBot — 제럴드 HP 150, 속도 160, 친근접근 후 연속 2회 베기
// ============================================================
class MirrorBot extends Enemy {
  constructor(x, y) {
    super(x, y, {
      hp: 150, speed: 160, damage: 20,
      expReward: 30, scoreReward: 30,
      collisionRadius: 15,
    })
    // 행동 상태: 'approach'(천천히 접근) | 'slash1' | 'pause' | 'slash2' | 'retreat'
    this.slashPhase = 'approach'
    this.slashTimer = 0
    this.slashCooldown = 3.5  // 다음 베기 사이클까지
    this.slashCycleTimer = 0
    this.slashDx = 0
    this.slashDy = 0
    this._slashEffect = null   // { life, maxLife, ex, ey }
  }

  update(deltaTime, player) {
    if (!this.isAlive()) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (this.slashPhase === 'approach') {
      // 친근하게 천천히 접근 (느린 속도)
      if (dist > 0) {
        this.x += (dx / dist) * this.speed * 0.65 * deltaTime
        this.y += (dy / dist) * this.speed * 0.65 * deltaTime
      }
      this.slashCycleTimer += deltaTime
      // 근거리(60px)에 오거나 타이머 경과 시 베기 시작
      if (dist < 70 || this.slashCycleTimer >= this.slashCooldown) {
        this.slashCycleTimer = 0
        this.slashPhase = 'slash1'
        this.slashTimer = 0
        if (dist > 0) { this.slashDx = dx / dist; this.slashDy = dy / dist }
      }

    } else if (this.slashPhase === 'slash1') {
      // 첫 번째 베기: 빠른 돌진
      this.x += this.slashDx * this.speed * 3.5 * deltaTime
      this.y += this.slashDy * this.speed * 3.5 * deltaTime
      this.slashTimer += deltaTime
      if (this.slashTimer >= 0.18) {
        this.slashPhase = 'pause'
        this.slashTimer = 0
        // 베기 이펙트
        this._slashEffect = { life: 0.25, maxLife: 0.25, ex: this.x + this.slashDx * 30, ey: this.y + this.slashDy * 30 }
      }

    } else if (this.slashPhase === 'pause') {
      // 잠깐 멈춤
      this.slashTimer += deltaTime
      if (this.slashTimer >= 0.22) {
        this.slashPhase = 'slash2'
        this.slashTimer = 0
        // 두 번째 베기 방향 갱신
        const dx2 = player.x - this.x, dy2 = player.y - this.y
        const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1
        this.slashDx = dx2 / d2; this.slashDy = dy2 / d2
      }

    } else if (this.slashPhase === 'slash2') {
      // 두 번째 베기
      this.x += this.slashDx * this.speed * 3.5 * deltaTime
      this.y += this.slashDy * this.speed * 3.5 * deltaTime
      this.slashTimer += deltaTime
      if (this.slashTimer >= 0.18) {
        this.slashPhase = 'retreat'
        this.slashTimer = 0
        this._slashEffect = { life: 0.25, maxLife: 0.25, ex: this.x + this.slashDx * 30, ey: this.y + this.slashDy * 30 }
      }

    } else if (this.slashPhase === 'retreat') {
      // 살짝 물러남
      if (dist > 0) {
        this.x -= (dx / dist) * this.speed * 1.2 * deltaTime
        this.y -= (dy / dist) * this.speed * 1.2 * deltaTime
      }
      this.slashTimer += deltaTime
      if (this.slashTimer >= 0.5) {
        this.slashPhase = 'approach'
        this.slashTimer = 0
      }
    }

    if (this._slashEffect) {
      this._slashEffect.life -= deltaTime
      if (this._slashEffect.life <= 0) this._slashEffect = null
    }

    this._facingLeft = (player.x - this.x) < 0
    this._updateAnim(deltaTime, this.slashPhase === 'slash1' || this.slashPhase === 'slash2' || this.slashPhase === 'approach')
  }

  onKilled() {
    GameState.killCount++
    GameState.mirrorBotKills = (GameState.mirrorBotKills || 0) + 1
    GameState.score += this.scoreReward * 5
    GameState.playerExp += this.expReward
    if (window.dropManager) {
      const dropType = window.dropManager.getDropTypeForEnemy(this.constructor.name)
      window.dropManager.spawnDrop(this.x, this.y, dropType)
    }
  }

  render(ctx) {
    if (!this.isAlive()) return
    // 베기 이펙트
    if (this._slashEffect && this._slashEffect.life > 0) {
      const a = this._slashEffect.life / this._slashEffect.maxLife
      ctx.save()
      ctx.globalAlpha = a
      ctx.strokeStyle = '#ffdd44'
      ctx.lineWidth = 4
      ctx.shadowColor = '#ffdd44'
      ctx.shadowBlur = 10
      for (let i = 0; i < 3; i++) {
        const angle = -0.4 + i * 0.4
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(
          this._slashEffect.ex + Math.cos(angle) * 24,
          this._slashEffect.ey + Math.sin(angle) * 24
        )
        ctx.stroke()
      }
      ctx.restore()
    }
    if (this._renderSprite(ctx)) { _drawHpBar(ctx, this, 32); return }
    const x = this.x, y = this.y
    const isDashing = this.slashPhase === 'slash1' || this.slashPhase === 'slash2'
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
// AIBot — 미러워커 HP 600, 속도 200, 보스, 충격파, 카트봇 소환
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

    // 플레이어 클론 애니메이션 상태
    this._mirrorFrame = 0
    this._mirrorTimer = 0
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
    GameState.bossKilled = true
    GameState.score += this.scoreReward * 5
    GameState.playerExp += this.expReward
    // 보스 처치 연출: 화면 전체 폭발 이펙트 알림
    GameState.bossDeathAnnounce = { timer: 3.5, maxTimer: 3.5 }
    if (window.dropManager) {
      const dropType = window.dropManager.getDropTypeForEnemy(this.constructor.name)
      window.dropManager.spawnDrop(this.x, this.y, dropType)
    }
  }

  render(ctx) {
    if (!this.isAlive()) return

    const charKey = window.GameState?.selectedCharacter || 'adam'
    const spr = window.CHAR_SPRITES?.[charKey]
    const cfg = window.CHAR_CONFIGS?.[charKey]
    const moving = (this.vx !== 0 || this.vy !== 0)
    const animCfg = cfg ? (moving ? cfg.walk : cfg.idle) : null
    const img = spr ? (moving ? spr.walk : spr.idle) : null

    // advance animation
    if (animCfg) {
      this._mirrorTimer += 1/60
      const frameDur = 1 / (animCfg.fps || 8)
      while (this._mirrorTimer >= frameDur) {
        this._mirrorTimer -= frameDur
        this._mirrorFrame = (this._mirrorFrame + 1) % (animCfg.frames || 1)
      }
    }

    const scale = cfg?.scale || 3
    const fw = animCfg?.fw || 32
    const fh = animCfg?.fh || 32
    const dw = Math.round(fw * scale)
    const dh = Math.round(fh * scale)
    const rx = Math.round(this.x - dw / 2)
    const ry = Math.round(this.y - dh * (cfg?.yAnchor || 0.8))

    if (img?.complete && img.naturalWidth > 0) {
      // 1. Black aura (radial gradient behind sprite)
      ctx.save()
      const auraCX = this.x
      const auraCY = this.y - dh * 0.4
      const auraR = dw * 1.1
      const grd = ctx.createRadialGradient(auraCX, auraCY, 0, auraCX, auraCY, auraR)
      grd.addColorStop(0, 'rgba(0,0,0,0.55)')
      grd.addColorStop(0.5, 'rgba(0,0,0,0.25)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(auraCX - auraR, auraCY - auraR, auraR * 2, auraR * 2)
      ctx.restore()

      // 2. Sprite with red outline
      ctx.save()
      ctx.shadowColor = '#ff2222'
      ctx.shadowBlur = 16
      ctx.imageSmoothingEnabled = fw > 16
      const sx = this._mirrorFrame * fw
      // flip if moving left
      if (this.vx < 0) {
        ctx.translate(rx + dw, ry)
        ctx.scale(-1, 1)
        ctx.drawImage(img, sx, 0, fw, fh, 0, 0, dw, dh)
      } else {
        ctx.drawImage(img, sx, 0, fw, fh, rx, ry, dw, dh)
      }
      ctx.imageSmoothingEnabled = false
      ctx.restore()

      // HP bar
      _drawHpBar(ctx, this, dw)
      return
    }

    // fallback: red circle with outline
    ctx.save()
    ctx.shadowColor = '#ff2222'
    ctx.shadowBlur = 16
    ctx.fillStyle = '#cc0000'
    ctx.beginPath()
    ctx.arc(this.x, this.y, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    _drawHpBar(ctx, this, 44)
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
      player.takeDamage(12)
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
