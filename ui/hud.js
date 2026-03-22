// 스킬 이름 → 타입 뱃지 매핑
const _SKILL_TYPE_BADGE = {
  '긴급 패치':   { label: '공격', color: '#ff6644' },
  '디버그':      { label: '공격', color: '#ff6644' },
  '고성방가':    { label: '공격', color: '#ff6644' },
  '커피 한 잔':  { label: '이속↑', color: '#ffdd44' },
  '멘탈관리':    { label: '방어', color: '#44aaff' },
  '쓰다듬기':    { label: '회복', color: '#ff88bb' },
  '낮잠자기':    { label: '회복', color: '#ff88bb' },
  '자동 저장':   { label: '패시브', color: '#aa88ff' },
  '산책하기':    { label: '패시브', color: '#aa88ff' },
}

// 스킬 이름 → 아이콘 파일 매핑
const _SKILL_ICON_MAP = {
  '긴급 패치':  'assets/custom/icons/skill_emergency_fix.png',
  '디버그':     'assets/custom/icons/skill_debug.png',
  '고성방가':   'assets/custom/icons/skill_sing.png',
  '커피 한 잔': 'assets/custom/icons/skill_coffee.png',
  '멘탈관리':   'assets/custom/icons/skill_mental.png',
  '쓰다듬기':   'assets/custom/icons/skill_pet_dog.png',
  '낮잠자기':   'assets/custom/icons/skill_nap.png',
  '자동 저장':  'assets/custom/icons/skill_autosave.png',
  '산책하기':   'assets/custom/icons/skill_walk.png',
}
// 지연 로드 캐시
const _skillIconCache = {}
function _getSkillIcon(name) {
  const src = _SKILL_ICON_MAP[name]
  if (!src) return null
  if (!_skillIconCache[name]) {
    const img = new Image()
    img.src = src
    _skillIconCache[name] = img
  }
  return _skillIconCache[name]
}
// 전역 노출 — levelup.js 등 다른 모듈에서 사용
window.getSkillIcon = _getSkillIcon

class HUD {
  constructor() {
    this._flyingGolds = []  // { x, y, targetX, targetY, type, t, duration, size }

    // 일시정지 메뉴 클릭
    window.addEventListener('click', (e) => {
      if (GameState.screen !== 'paused') return
      const canvas = document.getElementById('gameCanvas')
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (800 / rect.width)
      const y = (e.clientY - rect.top)  * (600 / rect.height)

      // 재개: y=252 ~ 288
      if (x >= 300 && x <= 500 && y >= 252 && y <= 288) {
        Game.resume(); return
      }
      // 메뉴로: y=306 ~ 342
      if (x >= 300 && x <= 500 && y >= 306 && y <= 342) {
        GameState.screen = 'lobby'; return
      }
      // 업그레이드: y=360 ~ 396
      if (x >= 300 && x <= 500 && y >= 360 && y <= 396) {
        GameState.screen = 'upgrade'; return
      }
    })
  }

  render(ctx, gameTime) {
    if (GameState.screen !== 'playing' && GameState.screen !== 'paused') return
    const player = Game.player
    if (!player) return

    // 피격 플래시
    if (window.GameState?.hitFlash > 0) {
      const flashAlpha = GameState.hitFlash * 0.35
      ctx.fillStyle = `rgba(255,30,30,${flashAlpha.toFixed(3)})`
      ctx.fillRect(0, 0, 800, 600)
    }

    this._drawTopBar(ctx, player, gameTime)
    this._drawBottomBar(ctx)
    this._drawDangerOverlay(ctx, gameTime)
    this._drawSpeechBubble(ctx)
    this._drawArrowGuide(ctx)
    this._drawUnlockNotification(ctx)
    this._drawGoldHUD(ctx)
    this._updateFlyingGolds(ctx, 1/60)

    // 일시정지 메뉴
    if (GameState.screen === 'paused') {
      this._drawPauseMenu(ctx)
    }
  }

  _drawTopBar(ctx, player, gameTime) {
    // 상단 반투명 바 배경
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, 800, 48)

    // HP 바 (개선: 두껍고 선명하게, 틱 마크)
    const hpRatio = player.hp / player.maxHp
    const hpColor = hpRatio < 0.3 ? '#ff3333' : hpRatio < 0.6 ? '#ffaa00' : '#33cc66'
    // 바 외곽 테두리
    ctx.fillStyle = '#111'
    ctx.fillRect(10, 10, 184, 22)
    // 바 배경 — loadingbar 타일
    if (window.drawUILoadingBar) {
      drawUILoadingBar(ctx, 12, 12, 180, 18)
    } else {
      ctx.fillStyle = '#222'
      ctx.fillRect(12, 12, 180, 18)
    }
    // HP 채움 (글로우)
    ctx.save()
    ctx.shadowColor = hpColor
    ctx.shadowBlur = hpRatio < 0.3 ? 8 : 4
    ctx.fillStyle = hpColor
    ctx.fillRect(12, 12, 180 * hpRatio, 18)
    ctx.restore()
    // 10% 틱 마크
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 1
    for (let t = 1; t < 10; t++) {
      ctx.beginPath(); ctx.moveTo(12 + 18 * t, 12); ctx.lineTo(12 + 18 * t, 30); ctx.stroke()
    }
    // 테두리
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 1
    ctx.strokeRect(12, 12, 180, 18)
    ctx.fillStyle = '#fff'
    ctx.font = '11px "VT323", monospace'
    ctx.fillText(`HP ${Math.ceil(player.hp)}/${player.maxHp}`, 14, 26)

    // 보호막 아이콘
    if (player.shields > 0) {
      ctx.fillStyle = '#44aaff'
      ctx.font = '12px "VT323", monospace'
      ctx.fillText(`🛡 ${player.shields}`, 200, 24)
    }

    // 타이머 (남은 시간)
    const remaining = Math.max(0, 180 - gameTime)
    const mins = Math.floor(remaining / 60)
    const secs = Math.floor(remaining % 60)
    const timeStr = `${mins}:${secs.toString().padStart(2,'0')}`
    ctx.fillStyle = remaining <= 30 ? '#ff4444' : '#ffffff'
    ctx.font = 'bold 22px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(timeStr, 400, 30)
    ctx.textAlign = 'left'

    // 출시 진행률
    ctx.fillStyle = '#333'
    ctx.fillRect(510, 12, 150, 10)
    ctx.fillStyle = '#44ffaa'
    ctx.fillRect(510, 12, 150 * (GameState.releaseProgress / 100), 10)
    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 16px "VT323", monospace'
    ctx.fillText(`출시 ${Math.floor(GameState.releaseProgress)}%`, 512, 36)

    // 점수
    ctx.fillStyle = '#FFD700'
    ctx.font = '13px "VT323", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${GameState.score.toLocaleString()}`, 788, 24)
    ctx.textAlign = 'left'
  }

  _drawBottomBar(ctx) {
    // 하단 반투명 바 배경
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 548, 800, 52)

    // 스킬 슬롯 4개 (Q/W/E/R)
    const keys = ['Q','W','E','R']
    for (let i = 0; i < 4; i++) {
      const sx = 12 + i * 112
      const sy = 553
      const state = Game.skillManager?.getSkillState(i) || { isEmpty: true }

      if (state.isEmpty) {
        ctx.fillStyle = '#1a1a2e'
        ctx.strokeStyle = '#333'
      } else if (state.cooldownRemaining > 0) {
        ctx.fillStyle = '#111'
        ctx.strokeStyle = '#444'
      } else {
        ctx.fillStyle = '#1e2a4a'
        ctx.strokeStyle = '#4488ff'
      }
      ctx.lineWidth = 1.5
      ctx.fillRect(sx, sy, 100, 40)
      ctx.strokeRect(sx, sy, 100, 40)

      if (!state.isEmpty) {
        // 스킬 아이콘 (있으면) — 키 레이블보다 먼저 그려서 레이블이 위에 오도록
        const icon = _getSkillIcon(state.name)
        if (icon?.complete && icon.naturalWidth > 0) {
          ctx.save()
          ctx.globalAlpha = state.cooldownRemaining > 0 ? 0.3 : 1.0
          ctx.imageSmoothingEnabled = true
          // 아이콘을 슬롯 왼쪽에 꽉 채워 넣기 (36×36)
          ctx.drawImage(icon, 0, 0, icon.naturalWidth, icon.naturalHeight, sx + 2, sy + 2, 36, 36)
          ctx.globalAlpha = 1
          ctx.imageSmoothingEnabled = false
          ctx.restore()
        }

        // 스킬 타입 뱃지
        const badge = _SKILL_TYPE_BADGE[state.name]
        if (badge) {
          ctx.fillStyle = badge.color + '33'
          ctx.fillRect(sx + 38, sy + 2, 58, 11)
          ctx.fillStyle = badge.color
          ctx.font = 'bold 9px "VT323", monospace'
          ctx.fillText(badge.label, sx + 40, sy + 11)
        }
        // 스킬 이름
        ctx.fillStyle = state.cooldownRemaining > 0 ? '#556' : '#aaccff'
        ctx.font = '11px "VT323", monospace'
        ctx.fillText(state.name.substring(0, 7), sx + 38, sy + 25)

        // 쿨다운 숫자
        if (state.cooldownRemaining > 0) {
          ctx.fillStyle = '#ff8844'
          ctx.font = 'bold 13px "VT323", monospace'
          ctx.textAlign = 'center'
          ctx.fillText(state.cooldownRemaining.toFixed(1), sx + 68, sy + 36)
          ctx.textAlign = 'left'

          // 쿨다운 진행 바
          ctx.fillStyle = '#224'
          ctx.fillRect(sx, sy + 38, 100, 3)
          const ratio = 1 - state.cooldownRemaining / state.cooldownMax
          ctx.fillStyle = '#4488ff'
          ctx.fillRect(sx, sy + 38, 100 * ratio, 3)
        }
        // LV 표시 (우하단)
        if (!state.isEmpty) {
          const lv = state.level || 1
          const lvLabel = lv >= 3 ? 'LV.MAX' : `LV.${lv}`
          const lvColor = lv >= 3 ? '#FFD700' : lv >= 2 ? '#aaddff' : '#667799'
          ctx.fillStyle = lvColor
          ctx.font = 'bold 8px "VT323", monospace'
          ctx.textAlign = 'right'
          ctx.fillText(lvLabel, sx + 98, sy + 14)
          ctx.textAlign = 'left'
        }
      }

      // 키 레이블 — 슬롯 전체 폭 스트립 (상단 고정, 항상 맨 위에 렌더)
      ctx.fillStyle = 'rgba(0,0,0,0.82)'
      ctx.fillRect(sx, sy, 100, 24)
      ctx.fillStyle = state.isEmpty ? '#555' : '#e8e8ff'
      ctx.font = 'bold 22px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(keys[i], sx + 50, sy + 19)
      ctx.textAlign = 'left'
    }

    // 빈 슬롯 힌트 (초반 안내)
    const allEmpty = !Game.skillManager?.slots?.some(Boolean)
    if (allEmpty) {
      ctx.fillStyle = '#556688'
      ctx.font = '11px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('적을 처치해 경험치를 모으면 레벨업 시 스킬을 획득합니다', 250, 571)
      ctx.textAlign = 'left'
    }

    // 레벨 & 경험치 바
    const RANKS = ['인턴', '주니어 개발자', '시니어 개발자', '팀장', '디렉터', '본부장', '임원', '대표']
    const rankName = RANKS[Math.min(GameState.playerLevel - 1, RANKS.length - 1)]
    ctx.fillStyle = '#ccaaff'
    ctx.font = 'bold 12px "VT323", monospace'
    ctx.fillText(`${rankName}  Lv.${GameState.playerLevel}`, 462, 568)

    const EXP_THRESHOLDS = [0, 30, 80, 160, 280, 450, 650, 900, 1200]
    const lvl = GameState.playerLevel
    const expNeeded = lvl < EXP_THRESHOLDS.length ? EXP_THRESHOLDS[lvl] : EXP_THRESHOLDS[EXP_THRESHOLDS.length - 1]
    const expCurrent = GameState.playerExp
    const expRatio = expNeeded > 0 ? Math.min(1, expCurrent / expNeeded) : 1

    ctx.fillStyle = '#333'
    ctx.fillRect(460, 576, 200, 8)
    ctx.fillStyle = '#aa66ff'
    ctx.fillRect(460, 576, 200 * expRatio, 8)
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 1
    ctx.strokeRect(460, 576, 200, 8)

    // 처치 수
    ctx.fillStyle = '#aaa'
    ctx.font = '11px "VT323", monospace'
    ctx.fillText(`처치: ${GameState.killCount}`, 670, 568)
  }

  _drawSpeechBubble(ctx) {
    const bubble = GameState.speechBubble
    if (!bubble || bubble.timer <= 0) return
    bubble.timer -= 1 / 60
    const player = Game.player
    if (!player) return

    const alpha = bubble.timer < 1.0 ? bubble.timer : 1.0
    ctx.save()
    ctx.globalAlpha = alpha

    // Measure text
    ctx.font = '15px "VT323", monospace'
    const tw = ctx.measureText(bubble.text).width
    const bw = tw + 20
    const bh = 28
    // Screen-space position: convert world coords via Camera offset
    const sx = player.x - (window.Camera?.x || 0)
    const sy = player.y - (window.Camera?.y || 0)
    const bx = sx - bw / 2
    const by = sy - 80

    // Bubble background (rounded rect + tail)
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.strokeStyle = '#334466'
    ctx.lineWidth = 1.5
    const r = 6
    ctx.beginPath()
    ctx.moveTo(bx + r, by)
    ctx.lineTo(bx + bw - r, by)
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
    ctx.lineTo(bx + bw, by + bh - r)
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
    ctx.lineTo(bx + bw / 2 + 8, by + bh)
    ctx.lineTo(bx + bw / 2, by + bh + 8)
    ctx.lineTo(bx + bw / 2 - 8, by + bh)
    ctx.lineTo(bx + r, by + bh)
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
    ctx.lineTo(bx, by + r)
    ctx.quadraticCurveTo(bx, by, bx + r, by)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Text
    ctx.fillStyle = '#112244'
    ctx.font = '15px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(bubble.text, bx + bw / 2, by + bh - 8)

    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
    ctx.restore()
  }

  _drawArrowGuide(ctx) {
    const tut = GameState.arrowTutorial
    if (!tut || tut.timer <= 0) return
    tut.timer -= 1 / 60

    const player = Game.player
    if (!player) return

    const alpha = tut.timer < 1.0 ? tut.timer : 1.0
    const px = player.x - (window.Camera?.x || 0)
    const py = player.y - (window.Camera?.y || 0)

    // Panel dimensions
    const pw = 88
    const ph = 96
    const bx = px + 48
    const by = py - ph / 2

    ctx.save()
    ctx.globalAlpha = alpha

    // Panel background
    ctx.fillStyle = 'rgba(10,14,30,0.88)'
    ctx.strokeStyle = '#4466aa'
    ctx.lineWidth = 1.5
    const r = 6
    ctx.beginPath()
    ctx.moveTo(bx + r, by)
    ctx.lineTo(bx + pw - r, by)
    ctx.quadraticCurveTo(bx + pw, by, bx + pw, by + r)
    ctx.lineTo(bx + pw, by + ph - r)
    ctx.quadraticCurveTo(bx + pw, by + ph, bx + pw - r, by + ph)
    ctx.lineTo(bx + r, by + ph)
    ctx.quadraticCurveTo(bx, by + ph, bx, by + ph - r)
    ctx.lineTo(bx, by + r)
    ctx.quadraticCurveTo(bx, by, bx + r, by)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Left tail pointer
    ctx.fillStyle = 'rgba(10,14,30,0.88)'
    ctx.strokeStyle = '#4466aa'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(bx, by + ph / 2 - 7)
    ctx.lineTo(bx - 9, by + ph / 2)
    ctx.lineTo(bx, by + ph / 2 + 7)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // "방향키" label
    ctx.fillStyle = '#aabbdd'
    ctx.font = 'bold 12px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('방향키', bx + pw / 2, by + 15)

    // Arrow cross layout: cx, cy = center of cross
    const cx = bx + pw / 2
    const cy = by + 56
    const step = 24
    const arrows = [
      { char: '↑', dx: 0, dy: -step },
      { char: '↓', dx: 0, dy: step },
      { char: '←', dx: -step, dy: 0 },
      { char: '→', dx: step, dy: 0 },
    ]
    ctx.font = 'bold 22px "VT323", monospace'
    ctx.textAlign = 'center'
    for (const a of arrows) {
      // Key box
      ctx.fillStyle = 'rgba(60,80,130,0.85)'
      ctx.strokeStyle = '#6688cc'
      ctx.lineWidth = 1
      ctx.fillRect(cx + a.dx - 12, cy + a.dy - 14, 24, 22)
      ctx.strokeRect(cx + a.dx - 12, cy + a.dy - 14, 24, 22)
      ctx.fillStyle = '#e8eeff'
      ctx.fillText(a.char, cx + a.dx, cy + a.dy + 3)
    }

    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
    ctx.restore()
  }

  _drawUnlockNotification(ctx) {
    const notif = GameState.unlockNotification
    if (!notif || notif.timer <= 0) return
    notif.timer -= 1/60
    const alpha = Math.min(1, notif.timer)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = 'rgba(60,0,100,0.85)'
    ctx.fillRect(200, 240, 400, 60)
    ctx.strokeStyle = '#aa44ff'
    ctx.lineWidth = 2
    ctx.strokeRect(200, 240, 400, 60)
    ctx.fillStyle = '#dd88ff'
    ctx.font = 'bold 22px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🔓 ' + notif.msg, 400, 278)
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
    ctx.restore()
  }

  _drawDangerOverlay(ctx, gameTime) {
    if (!GameState.playerDanger) return
    const alpha = 0.25 + 0.2 * Math.abs(Math.sin(gameTime * Math.PI * 2))
    ctx.strokeStyle = `rgba(255,50,50,${alpha})`
    ctx.lineWidth = 14
    ctx.strokeRect(7, 7, 786, 586)
  }

  _drawGoldHUD(ctx) {
    const inv = window.GameState?.goldInventory
    if (!inv) return

    // Preload gold images once using explicit paths (validator-friendly)
    if (!this._goldImgs) {
      this._goldImgs = {}
      const _goldPaths = {
        1: 'assets/icon/gold_1.png',
        2: 'assets/icon/gold_2.png',
        3: 'assets/icon/gold_3.png',
        4: 'assets/icon/gold_4.png',
      }
      for (const [k, src] of Object.entries(_goldPaths)) {
        const img = new Image()
        img.src = src
        this._goldImgs[k] = img
      }
    }

    // Only show types with count > 0
    const types = [1, 2, 3, 4].filter(t => (inv[t] || 0) > 0)
    if (types.length === 0) return

    const iconSize = 20
    const spacing = 52  // icon(20) + text space
    const totalW = types.length * spacing
    let startX = 790 - totalW
    const y = 4

    for (const type of types) {
      const img = this._goldImgs[type]
      const count = inv[type] || 0

      // Small shadow bg
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(startX - 2, y - 2, spacing, iconSize + 4)

      if (img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, startX, y, iconSize, iconSize)
      }
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 14px "VT323", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`\xd7${count}`, startX + iconSize + 2, y + 14)

      startX += spacing
    }
  }

  _drawPauseMenu(ctx) {
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0,0,15,0.78)'
    ctx.fillRect(0, 0, 800, 600)

    // 패널
    ctx.fillStyle = '#0d1a2e'
    ctx.strokeStyle = '#4488ff'
    ctx.lineWidth = 2
    ctx.fillRect(260, 180, 280, 240)
    ctx.strokeRect(260, 180, 280, 240)

    // 제목
    ctx.fillStyle = '#88aaff'
    ctx.font = 'bold 28px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('— 일시정지 —', 400, 220)

    // 버튼 3개: 재개 / 메뉴로 / 업그레이드
    const btns = [
      { label: '[ 재개 ]',    color: '#88ff88', y: 252 },
      { label: '[ 메뉴로 ]',  color: '#ccaaff', y: 306 },
      { label: '[ 업그레이드 ]', color: '#ffdd88', y: 360 },
    ]
    btns.forEach(({ label, color, y }) => {
      ctx.fillStyle = 'rgba(30,50,80,0.7)'
      ctx.strokeStyle = '#334466'
      ctx.lineWidth = 1
      ctx.fillRect(300, y, 200, 36)
      ctx.strokeRect(300, y, 200, 36)
      ctx.fillStyle = color
      ctx.font = 'bold 18px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, 400, y + 24)
    })

    ctx.textAlign = 'left'
  }

  spawnFlyingGold(worldX, worldY, type) {
    // Ensure gold images are preloaded using explicit paths (validator-friendly)
    if (!this._goldImgs) {
      this._goldImgs = {}
      const _goldPaths = {
        1: 'assets/icon/gold_1.png',
        2: 'assets/icon/gold_2.png',
        3: 'assets/icon/gold_3.png',
        4: 'assets/icon/gold_4.png',
      }
      for (const [k, src] of Object.entries(_goldPaths)) {
        const img = new Image()
        img.src = src
        this._goldImgs[k] = img
      }
    }

    // Convert world coords to screen coords using camera
    // Camera.x/y represent the top-left world position visible on screen
    const camX = window.Camera?.x || 0
    const camY = window.Camera?.y || 0
    const screenX = worldX - camX
    const screenY = worldY - camY

    // Target: approximate center of where the gold type icon appears in HUD
    // Gold HUD stacks from right; target center of the HUD area at top-right
    const targetX = 770
    const targetY = 14

    this._flyingGolds.push({
      x: screenX,
      y: screenY,
      targetX,
      targetY,
      type,
      t: 0,
      duration: 0.6,
      size: 16,
    })
  }

  _updateFlyingGolds(ctx, deltaTime) {
    if (!this._flyingGolds.length) return
    for (let i = this._flyingGolds.length - 1; i >= 0; i--) {
      const f = this._flyingGolds[i]
      f.t += (deltaTime || 1/60)
      const progress = Math.min(1, f.t / f.duration)
      const ease = 1 - Math.pow(1 - progress, 3)  // ease-out cubic

      const x = f.x + (f.targetX - f.x) * ease
      const y = f.y + (f.targetY - f.y) * ease

      const alpha = progress > 0.8 ? (1 - progress) * 5 : 1

      ctx.save()
      ctx.globalAlpha = alpha
      const img = this._goldImgs?.[f.type]
      if (img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x - f.size / 2, y - f.size / 2, f.size, f.size)
      } else {
        // Fallback circle
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(x, y, f.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.restore()

      if (progress >= 1) this._flyingGolds.splice(i, 1)
    }
  }
}

window.HUD = HUD
const _hud = new HUD()
window._hud = _hud
