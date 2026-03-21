/**
 * entities/player.js — Player 클래스 (GDD Part 3.1)
 * window.Player 로 전역 노출
 */

class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 24
    this.height = 36
    this.collisionRadius = 14

    // 스탯 (GDD Part 3.1)
    this.maxHp = 100
    this.hp = 100
    this.baseSpeed = 220
    this._speedMultiplier = 1
    this._damageMultiplier = 1  // 받는 피해 배율 (1 = 100%)

    // 무적
    this.invincibleTimer = 0
    this.invincibleDuration = 0.4

    // 보호막
    this.shields = 0

    // 버프 목록
    this.buffs = []  // { type, value, duration, remaining }
    this._baseSpeedMult = 1  // 패시브 스킬에 의한 영구 속도 배율
    this._baseDmgMult   = 1  // 메타 업그레이드에 의한 영구 피해 배율

    // 이동 방향 기억 (스킬용)
    this.lastDirX = 0
    this.lastDirY = 1

    // 깜빡임 (피격 시)
    this.flashTimer = 0

    // 스프라이트 애니메이션
    this._animTimer  = 0
    this._animFrame  = 0
    this._isMoving   = false
    this._facingLeft = false  // 좌향 미러링
  }

  // ── Computed properties ──

  get speed() {
    return this.baseSpeed * this._speedMultiplier
  }

  get isAlive() {
    return this.hp > 0
  }

  // ── 매 프레임 업데이트 ──

  update(deltaTime, keys) {
    // 버프 타이머 처리
    this.buffs = this.buffs.filter(b => {
      b.remaining -= deltaTime
      return b.remaining > 0
    })
    this._recalcBuffs()

    // 무적 타이머
    if (this.invincibleTimer > 0) this.invincibleTimer -= deltaTime

    // 깜빡임
    if (this.flashTimer > 0) this.flashTimer -= deltaTime

    // 이동
    let dx = 0, dy = 0
    if (keys['KeyW'] || keys['ArrowUp'])    dy -= 1
    if (keys['KeyS'] || keys['ArrowDown'])  dy += 1
    if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy)
      dx /= len; dy /= len
      this.lastDirX = dx
      this.lastDirY = dy
    }

    this._isMoving = (dx !== 0 || dy !== 0)
    if (dx < 0) this._facingLeft = true
    else if (dx > 0) this._facingLeft = false
    this.x += dx * this.speed * deltaTime
    this.y += dy * this.speed * deltaTime

    // 스프라이트 애니메이션 프레임 업데이트
    const charKey = window.GameState?.selectedCharacter || 'adam'
    const charCfg = window.CHAR_CONFIGS?.[charKey]
    if (charCfg) {
      const anim = this._isMoving ? charCfg.walk : charCfg.idle
      this._animTimer += deltaTime
      const frameDur = 1 / anim.fps
      while (this._animTimer >= frameDur) {
        this._animTimer -= frameDur
        this._animFrame = (this._animFrame + 1) % anim.frames
      }
    }

    // 캔버스 경계 클램프
    this.x = Math.max(this.collisionRadius, Math.min(800 - this.collisionRadius, this.x))
    this.y = Math.max(this.collisionRadius, Math.min(600 - this.collisionRadius, this.y))

    // GameState 동기화
    if (window.GameState) {
      GameState.playerDanger = this.hp / this.maxHp < 0.3
    }
  }

  // ── 피해 처리 ──

  takeDamage(amount) {
    if (this.invincibleTimer > 0) return
    if (this.shields > 0) {
      this.shields--
      this.invincibleTimer = this.invincibleDuration
      return
    }
    const actual = amount * this._damageMultiplier
    this.hp = Math.max(0, this.hp - actual)
    this.invincibleTimer = this.invincibleDuration
    this.flashTimer = 0.15
  }

  // ── 회복 ──

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  // ── 보호막 추가 ──

  addShield(count) {
    this.shields += count
  }

  // ── 버프 적용 ──

  /**
   * @param {string} type      - 'speed' | 'damageReduction' | ...
   * @param {number} value     - 배율값 (speed: 1.3 = 30% 증가, damageReduction: 0.2 = 20% 감소)
   * @param {number} duration  - 지속 초. Infinity 또는 9999 초과 시 패시브로 처리
   */
  applyBuff(type, value, duration) {
    // 같은 타입 기존 버프 제거 후 재적용
    this.buffs = this.buffs.filter(b => b.type !== type)
    if (duration === Infinity || duration > 9999) {
      this._applyPassive(type, value)
      return
    }
    this.buffs.push({ type, value, duration, remaining: duration })
    this._recalcBuffs()
  }

  _applyPassive(type, value) {
    if (type === 'speed')           this._baseSpeedMult = value
    if (type === 'damageReduction') this._baseDmgMult   = 1 - value
  }

  _recalcBuffs() {
    let speedMult = this._baseSpeedMult
    let dmgMult   = this._baseDmgMult
    for (const b of this.buffs) {
      if (b.type === 'speed')           speedMult *= b.value
      if (b.type === 'damageReduction') dmgMult   *= (1 - b.value)
    }
    this._speedMultiplier  = speedMult
    this._damageMultiplier = dmgMult
  }

  // ── 넉백 ──

  knockback(fromX, fromY, distance) {
    const dx = this.x - fromX
    const dy = this.y - fromY
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    this.x += (dx / len) * distance
    this.y += (dy / len) * distance
    this.x = Math.max(this.collisionRadius, Math.min(800 - this.collisionRadius, this.x))
    this.y = Math.max(this.collisionRadius, Math.min(600 - this.collisionRadius, this.y))
  }

  // ── 렌더링 ──

  render(ctx) {
    const x = this.x, y = this.y

    ctx.save()
    if (this.flashTimer > 0) ctx.globalAlpha = 0.35

    // 보호막 글로우
    if (this.shields > 0) {
      ctx.save()
      ctx.strokeStyle = '#44aaff'
      ctx.shadowColor = '#44aaff'
      ctx.shadowBlur  = 14
      ctx.lineWidth   = 2.5
      ctx.beginPath()
      ctx.arc(x, y - 4, this.collisionRadius + 10, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    // ── 스프라이트 렌더링 시도 ──
    const charKey = window.GameState?.selectedCharacter || 'adam'
    const cfg     = window.CHAR_CONFIGS?.[charKey]
    const spr     = window.CHAR_SPRITES?.[charKey]

    if (cfg && spr) {
      const anim = this._isMoving ? cfg.walk  : cfg.idle
      const img  = this._isMoving ? spr.walk  : spr.idle
      if (img?.complete && img.naturalWidth > 0) {
        const dw = anim.fw * cfg.scale
        const dh = anim.fh * cfg.scale
        const sx = this._animFrame * anim.fw
        const rx = Math.round(x - dw / 2)
        const ry = Math.round(y - dh * 0.75)
        ctx.imageSmoothingEnabled = false
        if (this._facingLeft) {
          ctx.save()
          ctx.translate(rx + dw, ry)
          ctx.scale(-1, 1)
          ctx.drawImage(img, sx, 0, anim.fw, anim.fh, 0, 0, dw, dh)
          ctx.restore()
        } else {
          ctx.drawImage(img, sx, 0, anim.fw, anim.fh, rx, ry, dw, dh)
        }
        ctx.imageSmoothingEnabled = true
        ctx.restore()
        this._drawHPBar(ctx, x, y)
        return
      }
    }

    // ── 폴백: 캔버스 직접 드로잉 ──
    this._drawCanvasPlayer(ctx, x, y)
    ctx.restore()
    this._drawHPBar(ctx, x, y)
  }

  _drawHPBar(ctx, x, y) {
    const barW = 38
    const barX = x - barW / 2
    const barY = y + 27
    ctx.fillStyle = '#222'
    ctx.fillRect(barX, barY, barW, 5)
    const hpRatio = this.hp / this.maxHp
    ctx.fillStyle = hpRatio > 0.5 ? '#44ff88' : hpRatio > 0.3 ? '#ffaa00' : '#ff3333'
    ctx.fillRect(barX, barY, barW * hpRatio, 5)
  }

  _drawCanvasPlayer(ctx, x, y) {
    // 다리
    ctx.fillStyle = '#2255cc'
    ctx.fillRect(x - 8, y + 10, 6, 14)
    ctx.fillRect(x + 2, y + 10, 6, 14)
    // 신발
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 9, y + 21, 8, 4)
    ctx.fillRect(x + 1, y + 21, 8, 4)
    // 몸통 (후디)
    ctx.fillStyle = '#4488ff'
    ctx.fillRect(x - 11, y - 13, 22, 24)
    // 후디 포켓
    ctx.fillStyle = '#3366cc'
    ctx.fillRect(x - 7, y + 4, 14, 7)
    // 팔
    ctx.fillStyle = '#4488ff'
    ctx.fillRect(x - 17, y - 10, 7, 18)
    ctx.fillRect(x + 10, y - 10, 7, 14)
    // 노트북
    ctx.fillStyle = '#888'
    ctx.fillRect(x - 19, y - 2, 13, 9)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(x - 18, y - 1, 11, 7)
    ctx.fillStyle = '#2244aa'
    ctx.fillRect(x - 17, y, 9, 5)
    ctx.fillStyle = '#44aaff'
    ctx.fillRect(x - 16, y + 1, 3, 1)
    // 머리
    ctx.fillStyle = '#66aaff'
    ctx.beginPath()
    ctx.arc(x, y - 21, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(200,230,255,0.4)'
    ctx.beginPath()
    ctx.arc(x - 3, y - 24, 5, 0, Math.PI * 2)
    ctx.fill()
    // 눈 (안경)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x - 7, y - 24, 5, 4)
    ctx.strokeRect(x + 2, y - 24, 5, 4)
    ctx.fillStyle = '#aaddff'
    ctx.fillRect(x - 6, y - 23, 3, 2)
    ctx.fillRect(x + 3, y - 23, 3, 2)
  }
}

// ─────────────────────────────────────────
// 전역 노출
// ─────────────────────────────────────────
window.Player = Player
