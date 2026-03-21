// entities/skills.js — M4: 스킬 확장
// 액티브 7종 (Q/W/E/R 슬롯) + 패시브 2종

// ---------------------------------------------------------------------------
// 시각 이펙트 저장소
// ---------------------------------------------------------------------------

const _skillEffects = []

function addEffect(effect) {
  _skillEffects.push(effect)
}

function updateAndRenderEffects(ctx, deltaTime) {
  for (let i = _skillEffects.length - 1; i >= 0; i--) {
    const e = _skillEffects[i]
    e.life -= deltaTime
    if (e.life <= 0) { _skillEffects.splice(i, 1); continue }
    const alpha = e.life / e.maxLife
    ctx.save()
    ctx.globalAlpha = alpha
    if (e.type === 'circle') {
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
      ctx.strokeStyle = e.color
      ctx.lineWidth = 3
      ctx.stroke()
    } else if (e.type === 'hit') {
      ctx.fillStyle = e.color
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.radius * (1 - alpha * 0.5), 0, Math.PI * 2)
      ctx.fill()
    } else if (e.type === 'fan') {
      ctx.beginPath()
      ctx.moveTo(e.x, e.y)
      ctx.arc(e.x, e.y, e.radius, e.startAngle, e.endAngle)
      ctx.closePath()
      ctx.fillStyle = e.color
      ctx.fill()
    } else if (e.type === 'beam') {
      ctx.strokeStyle = e.color
      ctx.lineWidth = e.width || 3
      ctx.shadowColor = e.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.moveTo(e.x, e.y)
      ctx.lineTo(e.x2, e.y2)
      ctx.stroke()
    } else if (e.type === 'burst') {
      const elapsed = 1 - alpha
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 4
      for (let j = 0; j < e.count; j++) {
        const angle = (j / e.count) * Math.PI * 2
        const r = e.radius * elapsed
        const px = e.x + Math.cos(angle) * r
        const py = e.y + Math.sin(angle) * r
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (e.type === 'float') {
      const floatY = e.y - (1 - alpha) * 36
      ctx.fillStyle = e.color
      ctx.font = e.font || 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.shadowColor = e.color
      ctx.shadowBlur = 6
      ctx.fillText(e.text, e.x, floatY)
      ctx.textAlign = 'left'
    }
    ctx.restore()
  }
}

// ---------------------------------------------------------------------------
// SkillManager
// ---------------------------------------------------------------------------

class SkillManager {
  constructor(player) {
    this.player = player
    // 4개 슬롯 (Q/W/E/R) — 액티브 스킬 전용
    this.slots = [null, null, null, null]
    this.cooldowns = [0, 0, 0, 0]

    // 패시브 스킬 (슬롯 없음)
    this.passives = new Set()
    this.autoSaveTimer = 0   // 자동 저장 타이머
    this.napTimer = 0        // 낮잠자기 남은 시간 (>0 이면 진행 중)

    // 스킬 데이터 정의
    this.skillDefs = {
      // ── 기존 스킬 ──
      '긴급수정': {
        name: '긴급 수정',
        type: 'active',
        cooldown: 5,
        level: 1,
        activate: (sm) => sm._emergencyFix(),
      },
      '디버그': {
        name: '디버그',
        type: 'active',
        cooldown: 2.5,
        level: 1,
        activate: (sm) => sm._debug(),
      },
      // ── M4 액티브 스킬 ──
      '우선순위정리': {
        name: '우선순위정리',
        type: 'active',
        cooldown: 6,
        level: 1,
        activate: (sm) => sm._prioritySort(),
      },
      '커피': {
        name: '커피 한 잔',
        type: 'active',
        cooldown: 20,
        level: 1,
        activate: (sm) => sm._coffee(),
      },
      '피규어청소': {
        name: '피규어청소',
        type: 'active',
        cooldown: 12,
        level: 1,
        activate: (sm) => sm._cleanFigure(),
      },
      '강아지': {
        name: '강아지쓰다듬기',
        type: 'active',
        cooldown: 15,
        level: 1,
        activate: (sm) => sm._petDog(),
      },
      '낮잠': {
        name: '낮잠자기',
        type: 'active',
        cooldown: 30,
        level: 1,
        activate: (sm) => sm._nap(),
      },
      // ── M4 패시브 스킬 ──
      '자동저장': {
        name: '자동 저장',
        type: 'passive',
        level: 1,
      },
      '산책': {
        name: '산책하기',
        type: 'passive',
        level: 1,
      },
    }
  }

  update(deltaTime) {
    // 쿨다운 감소
    for (let i = 0; i < 4; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - deltaTime)
    }

    // 자동 저장 패시브: 12초마다 보호막 1 충전
    if (this.passives.has('자동저장')) {
      this.autoSaveTimer += deltaTime
      if (this.autoSaveTimer >= 12) {
        this.autoSaveTimer = 0
        this.player.addShield(1)
        addEffect({ type: 'circle', x: this.player.x, y: this.player.y, radius: 32, color: '#44aaff', life: 0.5, maxLife: 0.5 })
      }
    }

    // 낮잠자기 타이머: 1.5초 경과 시 HP 50% 회복
    if (this.napTimer > 0) {
      this.napTimer -= deltaTime
      if (this.napTimer <= 0) {
        this.napTimer = 0
        const healAmt = Math.floor(this.player.maxHp * 0.5 * (GameState.healMultiplier || 1))
        this.player.heal(healAmt)
        addEffect({ type: 'circle', x: this.player.x, y: this.player.y, radius: 50, color: '#88ff88', life: 0.6, maxLife: 0.6 })
      }
    }
  }

  activateSkill(slot) {
    const skillId = this.slots[slot]
    if (!skillId) return
    if (this.cooldowns[slot] > 0) return
    const def = this.skillDefs[skillId]
    if (!def || def.type === 'passive') return
    def.activate(this)
    this.cooldowns[slot] = def.cooldown
  }

  assignSkill(slot, skillId) {
    this.slots[slot] = skillId
    this.cooldowns[slot] = 0
  }

  // 패시브 스킬 습득 (슬롯 불필요)
  assignPassive(skillId) {
    this.passives.add(skillId)
    if (skillId === '산책') {
      // 이동속도 +30% 영구 적용
      this.player.applyBuff('speed', 1.3, Infinity)
    }
    if (skillId === '자동저장') {
      this.autoSaveTimer = 0
    }
  }

  upgradeSkill(skillId) {
    const def = this.skillDefs[skillId]
    if (def) def.level = Math.min(4, (def.level || 1) + 1)
  }

  getSkillState(slot) {
    const skillId = this.slots[slot]
    if (!skillId) return { isEmpty: true }
    const def = this.skillDefs[skillId]
    if (!def) return { isEmpty: true }
    return {
      isEmpty: false,
      name: def.name,
      cooldownRemaining: this.cooldowns[slot],
      cooldownMax: def.cooldown,
      level: def.level || 1,
      isPassive: def.type === 'passive',
    }
  }

  renderEffects(ctx, deltaTime) {
    updateAndRenderEffects(ctx, deltaTime)
  }

  // ── 스킬 구현 ──────────────────────────────────────────────────────────────

  // 긴급 수정: 반경 120px 내 모든 적에게 피해 40
  _emergencyFix() {
    const p = this.player
    const def = this.skillDefs['긴급수정']
    let radius = 120
    let damage = 40
    if (def.level >= 2) damage += 20
    if (def.level >= 3) radius += 40
    if (def.level >= 4 && def.cooldown > 3) def.cooldown = 3
    damage = Math.floor(damage * (GameState.skillDamageMult || 1))

    for (const enemy of GameState.enemies) {
      if (!enemy.isAlive()) continue
      const dx = enemy.x - p.x
      const dy = enemy.y - p.y
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        enemy.takeDamage(damage)
        addEffect({ type: 'hit', x: enemy.x, y: enemy.y, radius: 10, color: '#ffaa00', life: 0.3, maxLife: 0.3 })
      }
    }
    addEffect({ type: 'circle', x: p.x, y: p.y, radius, color: '#ffaa00', life: 0.4, maxLife: 0.4 })
    addEffect({ type: 'burst', x: p.x, y: p.y, count: 14, radius: radius * 0.7, color: '#ffcc44', life: 0.45, maxLife: 0.45 })
    addEffect({ type: 'float', x: p.x, y: p.y - 20, text: 'BUG FIX!', color: '#ffaa00', life: 0.6, maxLife: 0.6 })
  }

  // 디버그: 가장 가까운 적 1명(Lv3+: 2명)에게 피해 70
  _debug() {
    const p = this.player
    const def = this.skillDefs['디버그']
    let damage = 70
    let targetCount = 1
    if (def.level >= 2) damage += 30
    if (def.level >= 3) targetCount = 2
    if (def.level >= 4 && def.cooldown > 1.5) def.cooldown = 1.5
    damage = Math.floor(damage * (GameState.skillDamageMult || 1))

    const alive = GameState.enemies.filter(e => e.isAlive())
    alive.sort((a, b) => {
      const da = (a.x - p.x) ** 2 + (a.y - p.y) ** 2
      const db = (b.x - p.x) ** 2 + (b.y - p.y) ** 2
      return da - db
    })

    for (let i = 0; i < Math.min(targetCount, alive.length); i++) {
      alive[i].takeDamage(damage)
      addEffect({ type: 'hit', x: alive[i].x, y: alive[i].y, radius: 14, color: '#44ffaa', life: 0.4, maxLife: 0.4 })
      addEffect({ type: 'beam', x: p.x, y: p.y, x2: alive[i].x, y2: alive[i].y, color: '#44ffaa', width: 4, life: 0.2, maxLife: 0.2 })
    }
    addEffect({ type: 'float', x: p.x, y: p.y - 20, text: 'DEBUG', color: '#44ffaa', life: 0.5, maxLife: 0.5 })
  }

  // 우선순위 정리: 전방 부채꼴(120°) 160px, 피해 30, 넉백 100px, 쿨 7초
  _prioritySort() {
    const p = this.player
    const radius = 160
    const damage = Math.floor(30 * (GameState.skillDamageMult || 1))
    const knockbackDist = 100
    const halfAngle = Math.PI / 3   // ±60° = 총 120°

    const facingAngle = Math.atan2(p.lastDirY, p.lastDirX)

    for (const enemy of GameState.enemies) {
      if (!enemy.isAlive()) continue
      const dx = enemy.x - p.x
      const dy = enemy.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) continue

      let diff = Math.atan2(dy, dx) - facingAngle
      while (diff >  Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI

      if (Math.abs(diff) <= halfAngle) {
        enemy.takeDamage(damage)
        if (dist > 0) {
          enemy.x = Math.max(20, Math.min(780, enemy.x + (dx / dist) * knockbackDist))
          enemy.y = Math.max(20, Math.min(580, enemy.y + (dy / dist) * knockbackDist))
        }
        addEffect({ type: 'hit', x: enemy.x, y: enemy.y, radius: 8, color: '#ff8844', life: 0.3, maxLife: 0.3 })
      }
    }
    addEffect({
      type: 'fan',
      x: p.x, y: p.y,
      radius,
      startAngle: facingAngle - halfAngle,
      endAngle: facingAngle + halfAngle,
      color: 'rgba(255,136,68,0.4)',
      life: 0.35, maxLife: 0.35,
    })
  }

  // 커피 한 잔: 이동속도 +40% (5초), 현재 쿨다운 20% 단축, 쿨 20초
  _coffee() {
    const p = this.player
    p.applyBuff('speed', 1.4, 5)
    for (let i = 0; i < 4; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] *= 0.8
    }
    addEffect({ type: 'circle', x: p.x, y: p.y, radius: 40, color: '#ffdd44', life: 0.5, maxLife: 0.5 })
    addEffect({ type: 'burst', x: p.x, y: p.y, count: 10, radius: 55, color: '#ffdd44', life: 0.5, maxLife: 0.5 })
    addEffect({ type: 'float', x: p.x, y: p.y - 20, text: '+SPEED', color: '#ffdd44', life: 0.8, maxLife: 0.8, font: 'bold 16px monospace' })
  }

  // 피규어 청소하기: 받는 피해 -40% (4초), 주변 150px 적 넉백 120px, 쿨 12초
  _cleanFigure() {
    const p = this.player
    p.applyBuff('damageReduction', 0.4, 4)

    for (const enemy of GameState.enemies) {
      if (!enemy.isAlive()) continue
      const dx = enemy.x - p.x
      const dy = enemy.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= 150 && dist > 0) {
        enemy.x = Math.max(20, Math.min(780, enemy.x + (dx / dist) * 120))
        enemy.y = Math.max(20, Math.min(580, enemy.y + (dy / dist) * 120))
      }
    }
    addEffect({ type: 'circle', x: p.x, y: p.y, radius: 150, color: '#aaddff', life: 0.5, maxLife: 0.5 })
    addEffect({ type: 'burst', x: p.x, y: p.y, count: 12, radius: 140, color: '#aaddff', life: 0.5, maxLife: 0.5 })
    addEffect({ type: 'float', x: p.x, y: p.y - 20, text: 'GUARD', color: '#aaddff', life: 0.7, maxLife: 0.7 })
  }

  // 강아지 쓰다듬기: 최대 HP 25% 회복, 쿨 15초 (20→15 밸런스 조정)
  _petDog() {
    const p = this.player
    const healAmt = Math.floor(p.maxHp * 0.25 * (GameState.healMultiplier || 1))
    p.heal(healAmt)
    addEffect({ type: 'circle', x: p.x, y: p.y, radius: 28, color: '#ff88bb', life: 0.6, maxLife: 0.6 })
    addEffect({ type: 'burst', x: p.x, y: p.y, count: 8, radius: 48, color: '#ff88bb', life: 0.6, maxLife: 0.6 })
    addEffect({ type: 'float', x: p.x, y: p.y - 20, text: '+HP', color: '#ff88bb', life: 0.8, maxLife: 0.8, font: 'bold 18px monospace' })
  }

  // 낮잠자기: 이동 1.5초 정지 후 HP 50% 회복, 쿨 30초
  _nap() {
    if (this.napTimer > 0) return
    this.player.applyBuff('speed', 0, 1.5)
    this.napTimer = 1.5
    addEffect({ type: 'circle', x: this.player.x, y: this.player.y, radius: 22, color: '#8888ff', life: 1.5, maxLife: 1.5 })
    addEffect({ type: 'float', x: this.player.x, y: this.player.y - 30, text: 'zzz', color: '#aaaaff', life: 1.5, maxLife: 1.5, font: 'bold 20px monospace' })
  }
}

// ---------------------------------------------------------------------------
// 전역 노출 및 자동 등록
// ---------------------------------------------------------------------------

window.SkillManager = SkillManager

if (window.Game && Game.player) {
  Game.registerSkillSystem(new SkillManager(Game.player))
} else {
  window.addEventListener('gameReady', () => {
    if (Game.player) Game.registerSkillSystem(new SkillManager(Game.player))
  })
  window.addEventListener('playerCreated', (e) => {
    Game.registerSkillSystem(new SkillManager(e.detail.player))
  })
}
