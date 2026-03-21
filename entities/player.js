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

    this.x += dx * this.speed * deltaTime
    this.y += dy * this.speed * deltaTime

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
    // 피격 깜빡임
    if (this.flashTimer > 0) {
      ctx.globalAlpha = 0.4
    }

    // 보호막 글로우
    if (this.shields > 0) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.collisionRadius + 8, 0, Math.PI * 2)
      ctx.strokeStyle = '#44aaff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 몸통 (파란 계열 사람 실루엣 — 단순 사각형 + 원)
    ctx.fillStyle = '#4488ff'
    ctx.fillRect(this.x - 10, this.y - 14, 20, 24)   // 몸통
    ctx.beginPath()
    ctx.arc(this.x, this.y - 20, 10, 0, Math.PI * 2) // 머리
    ctx.fillStyle = '#66aaff'
    ctx.fill()

    // 노트북 (작은 회색 사각형)
    ctx.fillStyle = '#aaaaaa'
    ctx.fillRect(this.x + 6, this.y - 8, 10, 7)

    // HP 바 (플레이어 하단)
    const barWidth = 36
    const barX = this.x - barWidth / 2
    const barY = this.y + 22
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barWidth, 5)
    const hpRatio = this.hp / this.maxHp
    ctx.fillStyle = hpRatio > 0.5 ? '#44ff88' : hpRatio > 0.3 ? '#ffaa00' : '#ff3333'
    ctx.fillRect(barX, barY, barWidth * hpRatio, 5)

    ctx.globalAlpha = 1
  }
}

// ─────────────────────────────────────────
// 전역 노출
// ─────────────────────────────────────────
window.Player = Player
