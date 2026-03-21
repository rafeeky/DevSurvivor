// ui/joystick.js — 모바일 가상 조이스틱 (GDD Part 2.2)
// 터치 디바이스에서만 활성화

const JOYSTICK_RADIUS = 60
const KNOB_RADIUS = 24
// 다이아몬드 배치: 엄지 자연스러운 위치 (중심 710,480, 간격 64px)
const SKILL_BUTTONS = [
  { slot: 0, label: 'Q', x: 648, y: 480 },  // 왼쪽
  { slot: 1, label: 'W', x: 710, y: 416 },  // 위
  { slot: 2, label: 'E', x: 772, y: 480 },  // 오른쪽
  { slot: 3, label: 'R', x: 710, y: 544 },  // 아래
]
const BTN_RADIUS = 28

class VirtualJoystick {
  constructor() {
    this.active = false
    this.baseX = 0
    this.baseY = 0
    this.knobX = 0
    this.knobY = 0
    this.touchId = null

    // 스킬 버튼 터치 ID 추적
    this.skillTouchIds = {}

    this._isTouchDevice = false
    this._bindEvents()
  }

  _bindEvents() {
    const canvas = document.getElementById('gameCanvas')
    if (!canvas) return

    canvas.addEventListener('touchstart', e => {
      e.preventDefault()
      this._isTouchDevice = true
      for (const t of e.changedTouches) {
        const { cx, cy } = this._toCanvas(t, canvas)
        // 스킬 버튼 체크 (오른쪽 영역)
        const btn = this._hitSkillButton(cx, cy)
        if (btn !== -1) {
          this.skillTouchIds[t.identifier] = btn
          if (GameState.screen === 'playing' && !GameState.isPaused) {
            Game.skillManager?.activateSkill(btn)
          }
          continue
        }
        // 조이스틱 (왼쪽 절반, 미사용 터치만)
        if (cx < 500 && this.touchId === null) {
          this.touchId = t.identifier
          this.active = true
          this.baseX = cx
          this.baseY = cy
          this.knobX = cx
          this.knobY = cy
        }
      }
    }, { passive: false })

    canvas.addEventListener('touchmove', e => {
      e.preventDefault()
      for (const t of e.changedTouches) {
        if (t.identifier !== this.touchId) continue
        const { cx, cy } = this._toCanvas(t, canvas)
        const dx = cx - this.baseX
        const dy = cy - this.baseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const clamped = Math.min(dist, JOYSTICK_RADIUS)
        const angle = Math.atan2(dy, dx)
        this.knobX = this.baseX + Math.cos(angle) * clamped
        this.knobY = this.baseY + Math.sin(angle) * clamped
        this._updateKeys(dx, dy)
      }
    }, { passive: false })

    canvas.addEventListener('touchend', e => {
      e.preventDefault()
      for (const t of e.changedTouches) {
        if (t.identifier === this.touchId) {
          this.active = false
          this.touchId = null
          this._clearKeys()
        }
        if (t.identifier in this.skillTouchIds) {
          delete this.skillTouchIds[t.identifier]
        }
      }
    }, { passive: false })

    canvas.addEventListener('touchcancel', e => {
      this.active = false
      this.touchId = null
      this._clearKeys()
      this.skillTouchIds = {}
    }, { passive: false })
  }

  _toCanvas(touch, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = 800 / rect.width
    const scaleY = 600 / rect.height
    return {
      cx: (touch.clientX - rect.left) * scaleX,
      cy: (touch.clientY - rect.top) * scaleY,
    }
  }

  _hitSkillButton(cx, cy) {
    for (const btn of SKILL_BUTTONS) {
      const dx = cx - btn.x
      const dy = cy - btn.y
      if (Math.sqrt(dx * dx + dy * dy) < BTN_RADIUS) return btn.slot
    }
    return -1
  }

  _updateKeys(dx, dy) {
    if (!window.inputKeys) return
    const dead = 12
    inputKeys['KeyW'] = dy < -dead
    inputKeys['KeyS'] = dy > dead
    inputKeys['KeyA'] = dx < -dead
    inputKeys['KeyD'] = dx > dead
  }

  _clearKeys() {
    if (!window.inputKeys) return
    inputKeys['KeyW'] = false
    inputKeys['KeyS'] = false
    inputKeys['KeyA'] = false
    inputKeys['KeyD'] = false
  }

  render(ctx) {
    if (!this._isTouchDevice) return
    if (GameState.screen !== 'playing') return

    ctx.save()
    ctx.globalAlpha = 0.5

    // 조이스틱 베이스
    if (this.active) {
      ctx.beginPath()
      ctx.arc(this.baseX, this.baseY, JOYSTICK_RADIUS, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fill()

      // 조이스틱 노브
      ctx.beginPath()
      ctx.arc(this.knobX, this.knobY, KNOB_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fill()
    }

    // 스킬 버튼
    ctx.globalAlpha = 0.7
    for (const btn of SKILL_BUTTONS) {
      const skill = Game.skillManager?.slots?.[btn.slot]
      const cd = Game.skillManager?.cooldowns?.[btn.slot] ?? 0
      const maxCd = Game.skillManager?.maxCooldowns?.[btn.slot] ?? 1

      // 버튼 배경
      ctx.beginPath()
      ctx.arc(btn.x, btn.y, BTN_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = skill ? (cd > 0 ? '#334' : '#226') : '#222'
      ctx.fill()
      ctx.strokeStyle = skill ? '#4488ff' : '#445'
      ctx.lineWidth = 2
      ctx.stroke()

      // 쿨다운 호
      if (skill && cd > 0) {
        const ratio = cd / maxCd
        ctx.beginPath()
        ctx.moveTo(btn.x, btn.y)
        ctx.arc(btn.x, btn.y, BTN_RADIUS, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2)
        ctx.closePath()
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fill()
      }

      // 라벨: 스킬 없으면 Q/W/E/R, 있으면 키 + 스킬 이름 약칭
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (skill) {
        // 키 레이블 (위쪽 작게)
        ctx.fillStyle = '#aaccff'
        ctx.font = 'bold 10px monospace'
        ctx.fillText(btn.label, btn.x, btn.y - 9)
        // 스킬 이름 앞 3자 (아래쪽)
        ctx.fillStyle = cd > 0 ? '#778899' : '#ffffff'
        ctx.font = 'bold 11px monospace'
        ctx.fillText(skill.slice(0, 3), btn.x, btn.y + 7)
      } else {
        ctx.fillStyle = '#555'
        ctx.font = 'bold 14px monospace'
        ctx.fillText(btn.label, btn.x, btn.y)
      }
    }

    ctx.textBaseline = 'alphabetic'
    ctx.restore()
  }
}

window._joystick = new VirtualJoystick()
