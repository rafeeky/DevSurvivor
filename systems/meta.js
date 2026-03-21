// systems/meta.js — GDD Part 6.3 출시 포인트 & Part 6.4 메타 업그레이드
// Mason 담당 (M5)

// ── 업그레이드 정의 ────────────────────────────────────────────────────────
const META_UPGRADES = [
  { name: '조금 더 버티기',     desc: 'maxHP +15/단계',       costs: [15, 25, 40], maxLevel: 3 },
  { name: '더 빠르게 움직이기', desc: '이동속도 +15px/s',      costs: [10, 20, 35], maxLevel: 3 },
  { name: '정리 속도 높이기',   desc: '스킬 데미지 +8%',       costs: [15, 25, 40], maxLevel: 3 },
  { name: '빠른 판단',          desc: '경험치 획득 +15%',      costs: [20, 35, 50], maxLevel: 3 },
  { name: '회복 습관',          desc: '회복량 +10%',           costs: [15, 25, 40], maxLevel: 3 },
  { name: '실수 줄이기',        desc: '받는 피해 -5%',         costs: [20, 35, 50], maxLevel: 3 },
  { name: '준비된 하루',        desc: '시작 시 보호막 1 충전',  costs: [25],         maxLevel: 1 },
  { name: '손이 빨라짐',        desc: '모든 쿨다운 -0.3초',    costs: [20, 35, 55], maxLevel: 3 },
  { name: '성과 더 받기',       desc: '출시 포인트 획득 +15%', costs: [25, 40],     maxLevel: 2 },
  { name: '시작부터 하나 더',   desc: '시작 시 기본 스킬 지급', costs: [30],         maxLevel: 1 },
]

// ── MetaManager ────────────────────────────────────────────────────────────
const MetaManager = {
  STORAGE_POINTS:   'devsurvival_points',
  STORAGE_UPGRADES: 'devsurvival_upgrades',

  loadPoints() {
    return parseInt(localStorage.getItem(this.STORAGE_POINTS) || '0')
  },
  savePoints(p) {
    localStorage.setItem(this.STORAGE_POINTS, String(Math.max(0, p)))
  },

  loadUpgrades() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.STORAGE_UPGRADES) || '[]')
      const arr = Array(10).fill(0)
      raw.forEach((v, i) => { if (i < 10) arr[i] = v || 0 })
      return arr
    } catch { return Array(10).fill(0) }
  },
  saveUpgrades(levels) {
    localStorage.setItem(this.STORAGE_UPGRADES, JSON.stringify(levels))
  },

  // ── GDD 6.3: 출시 포인트 계산 ──────────────────────────────────────────
  calculateReleasePoints() {
    const s = GameState
    let pts = 5                              // 플레이 시작 무조건
    if (s.gameTime >= 60)           pts += 10  // 1분 생존
    if (s.gameTime >= 120)          pts += 15  // 2분 생존
    if (s._lastWin)                 pts += 20  // 3분 완주
    if (s.killCount >= 50)          pts += 10  // 적 50마리 처치
    pts += (s.mirrorBotKills || 0) * 8         // 미러봇 처치 × 8
    if (s.aiBotReached)             pts += 15  // AI봇 도달
    if (s.aiBotKilled)              pts += 30  // AI봇 처치
    if (s.releaseProgress >= 100)   pts += 10  // 출시 진행률 100%

    // 성과 더 받기 메타 보너스
    const levels = this.loadUpgrades()
    if (levels[8] > 0) pts = Math.floor(pts * (1 + 0.15 * levels[8]))
    return pts
  },

  // 게임 종료 시 포인트 적립 (한 판당 1회)
  awardPoints() {
    const earned = this.calculateReleasePoints()
    this.savePoints(this.loadPoints() + earned)
    return earned
  },

  // ── GDD 6.4: 업그레이드 구매 ───────────────────────────────────────────
  purchase(index) {
    const levels = this.loadUpgrades()
    const upg    = META_UPGRADES[index]
    if (!upg || levels[index] >= upg.maxLevel) return false
    const cost = upg.costs[levels[index]]
    const pts  = this.loadPoints()
    if (pts < cost) return false
    this.savePoints(pts - cost)
    levels[index]++
    this.saveUpgrades(levels)
    return true
  },

  // ── GDD 6.4: 메타 효과 적용 ────────────────────────────────────────────
  applyToPlayer(player, skillManager) {
    const lv = this.loadUpgrades()

    // 0. 조금 더 버티기: maxHP +15/lv
    if (lv[0] > 0) { player.maxHp += 15 * lv[0]; player.hp = player.maxHp }

    // 1. 더 빠르게 움직이기: speed +15px/s/lv
    if (lv[1] > 0) player.baseSpeed += 15 * lv[1]

    // 2. 정리 속도 높이기: 스킬 데미지 배율 (skills.js에서 참조)
    GameState.skillDamageMult = 1 + 0.08 * (lv[2] || 0)

    // 3. 빠른 판단: 경험치 배율 (enemies.js에서 참조)
    GameState.expMultiplier = 1 + 0.15 * (lv[3] || 0)

    // 4. 회복 습관: 회복량 배율 (skills.js에서 참조)
    GameState.healMultiplier = 1 + 0.10 * (lv[4] || 0)

    // 5. 실수 줄이기: 받는 피해 감소 -5%/lv (영구 패시브)
    if (lv[5] > 0) player.applyBuff('damageReduction', 0.05 * lv[5], Infinity)

    // 6. 준비된 하루: 시작 시 보호막 1
    if (lv[6] > 0) player.addShield(1)

    // 7. 손이 빨라짐: 모든 액티브 스킬 쿨다운 -0.3초/lv
    if (lv[7] > 0 && skillManager) {
      const red = 0.3 * lv[7]
      for (const def of Object.values(skillManager.skillDefs)) {
        if (def.type === 'active') def.cooldown = Math.max(0.5, def.cooldown - red)
      }
    }

    // 8. 성과 더 받기: calculateReleasePoints()에서 처리

    // 9. 시작부터 하나 더: 랜덤 기본 스킬 1개 지급
    if (lv[9] > 0 && skillManager) {
      const basics = ['긴급수정', '디버그']
      const pick = basics[Math.floor(Math.random() * basics.length)]
      const emptySlot = skillManager.slots.findIndex(s => s === null)
      if (emptySlot !== -1) skillManager.assignSkill(emptySlot, pick)
    }
  },

  // ── 메타 업그레이드 아이콘 매핑 ───────────────────────────────────────
  _iconMap: {
    '조금 더 버티기':     'assets/custom/icons/skill_emergency_fix.png',
    '더 빠르게 움직이기': 'assets/custom/icons/skill_coffee.png',
    '정리 속도 높이기':   'assets/custom/icons/skill_debug.png',
    '빠른 판단':          'assets/custom/icons/skill_priority_sort.png',
    '회복 습관':          'assets/custom/icons/skill_pet_dog.png',
    '실수 줄이기':        'assets/custom/icons/skill_figure_clean.png',
    '준비된 하루':        'assets/custom/icons/skill_autosave.png',
    '손이 빨라짐':        'assets/custom/icons/skill_emergency_fix.png',
    '성과 더 받기':       'assets/custom/icons/skill_priority_sort.png',
    '시작부터 하나 더':   'assets/custom/icons/skill_nap.png',
  },
  _iconCache: {},
  _getIcon(name) {
    const src = this._iconMap[name]
    if (!src) return null
    if (!this._iconCache[name]) {
      const img = new Image(); img.src = src
      this._iconCache[name] = img
    }
    return this._iconCache[name]
  },

  // ── 업그레이드 화면 렌더링 ─────────────────────────────────────────────
  _buyRects: [],
  _page: 0,
  _prevRect: null,
  _nextRect: null,

  render(ctx) {
    if (GameState.screen !== 'upgrade') return

    const levels = this.loadUpgrades()
    const pts    = this.loadPoints()

    // 배경
    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, 800, 600)
    ctx.strokeStyle = '#1a1a3e'
    ctx.lineWidth = 1
    for (let x = 0; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke() }
    for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(800,y); ctx.stroke() }

    // 헤더
    ctx.textAlign = 'center'
    ctx.fillStyle = '#4488ff'
    ctx.font = 'bold 26px monospace'
    ctx.fillText('업그레이드', 400, 34)
    ctx.fillStyle = '#FFD700'
    ctx.font = '15px monospace'
    ctx.fillText(`보유 출시 포인트: ${pts}`, 400, 56)

    // 페이지 표시
    const totalPages = Math.ceil(META_UPGRADES.length / 6)
    ctx.fillStyle = '#778899'
    ctx.font = '12px monospace'
    ctx.fillText(`${this._page + 1} / ${totalPages} 페이지`, 400, 72)

    // 아이템 그리드 (2열 × 3행, 페이지당 6개)
    this._buyRects = []
    const colW = 388, rowH = 120
    const colX = [4, 408]
    const startY = 78
    const pageStart = this._page * 6

    for (let pageIdx = 0; pageIdx < 6; pageIdx++) {
      const i = pageStart + pageIdx
      if (i >= META_UPGRADES.length) { this._buyRects.push(null); continue }

      const col  = pageIdx % 2
      const row  = Math.floor(pageIdx / 2)
      const bx   = colX[col]
      const by   = startY + row * rowH
      const upg  = META_UPGRADES[i]
      const lv   = levels[i]
      const maxed  = lv >= upg.maxLevel
      const cost   = maxed ? 0 : upg.costs[lv]
      const canBuy = !maxed && pts >= cost

      // 카드 배경
      ctx.fillStyle = '#111827'
      ctx.strokeStyle = maxed ? '#44aa44' : canBuy ? '#4466aa' : '#2a2a4a'
      ctx.lineWidth = 1.5
      ctx.fillRect(bx, by, colW, rowH - 6)
      ctx.strokeRect(bx, by, colW, rowH - 6)

      // 아이콘 (좌측)
      const icon = this._getIcon(upg.name)
      const iconSize = 36
      if (icon?.complete && icon.naturalWidth > 0) {
        ctx.save()
        ctx.imageSmoothingEnabled = true
        ctx.globalAlpha = maxed ? 1 : canBuy ? 0.9 : 0.4
        ctx.drawImage(icon, 0, 0, icon.naturalWidth, icon.naturalHeight, bx + 6, by + 6, iconSize, iconSize)
        ctx.globalAlpha = 1
        ctx.restore()
      }

      const textX = bx + iconSize + 16

      // 이름
      ctx.fillStyle = '#ddeeff'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(upg.name, textX, by + 24)

      // 레벨 별
      let stars = ''
      for (let s = 0; s < upg.maxLevel; s++) stars += s < lv ? '★' : '☆'
      ctx.fillStyle = '#FFD700'
      ctx.font = '14px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(stars, bx + colW - 8, by + 24)

      // 효과 설명
      ctx.fillStyle = '#aabbcc'
      ctx.font = '13px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(lv > 0 ? `${upg.desc} (${lv}단계)` : upg.desc, textX, by + 50)

      // 구매 버튼 또는 MAX
      if (maxed) {
        ctx.fillStyle = '#44aa44'
        ctx.font = 'bold 14px monospace'
        ctx.textAlign = 'right'
        ctx.fillText('MAX', bx + colW - 8, by + 90)
        this._buyRects.push(null)
      } else {
        const btnX = bx + colW - 116
        const btnY = by + 68
        const btnW = 108, btnH = 32
        ctx.fillStyle = canBuy ? '#1e3a6e' : '#1a1a2a'
        ctx.strokeStyle = canBuy ? '#4488ff' : '#444466'
        ctx.lineWidth = 1
        ctx.fillRect(btnX, btnY, btnW, btnH)
        ctx.strokeRect(btnX, btnY, btnW, btnH)
        ctx.font = '13px monospace'
        ctx.textAlign = 'center'
        if (canBuy) {
          ctx.fillStyle = '#ffffff'
          ctx.fillText(`구매 ${cost}pt`, btnX + btnW / 2, btnY + 21)
        } else {
          ctx.fillStyle = '#ff6666'
          ctx.fillText(`부족 (${cost}pt)`, btnX + btnW / 2, btnY + 21)
        }
        this._buyRects.push({ x: btnX, y: btnY, w: btnW, h: btnH, index: i })
      }
    }

    // 페이지 네비게이션 버튼
    const navY = startY + 3 * rowH + 6  // 78 + 360 + 6 = 444

    this._prevRect = null
    this._nextRect = null

    if (this._page > 0) {
      ctx.fillStyle = '#1a2a4a'
      ctx.strokeStyle = '#4466aa'
      ctx.lineWidth = 1.5
      ctx.fillRect(190, navY, 140, 36)
      ctx.strokeRect(190, navY, 140, 36)
      ctx.fillStyle = '#88aaff'
      ctx.font = '13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('◀ 이전', 260, navY + 23)
      this._prevRect = { x: 190, y: navY, w: 140, h: 36 }
    }

    if (this._page < totalPages - 1) {
      ctx.fillStyle = '#1a2a4a'
      ctx.strokeStyle = '#4466aa'
      ctx.lineWidth = 1.5
      ctx.fillRect(470, navY, 140, 36)
      ctx.strokeRect(470, navY, 140, 36)
      ctx.fillStyle = '#88aaff'
      ctx.font = '13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('다음 ▶', 540, navY + 23)
      this._nextRect = { x: 470, y: navY, w: 140, h: 36 }
    }

    // 돌아가기 버튼
    ctx.fillStyle = '#0d1a0d'
    ctx.strokeStyle = '#44aa44'
    ctx.lineWidth = 2
    ctx.fillRect(300, 492, 200, 44)
    ctx.strokeRect(300, 492, 200, 44)
    ctx.fillStyle = '#88ff88'
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('[ 돌아가기 ]', 400, 520)
    ctx.textAlign = 'left'
  },

  handleClick(x, y) {
    if (GameState.screen !== 'upgrade') return
    for (const rect of this._buyRects) {
      if (!rect) continue
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        this.purchase(rect.index)
        return
      }
    }
    if (this._prevRect && x >= this._prevRect.x && x <= this._prevRect.x + this._prevRect.w &&
        y >= this._prevRect.y && y <= this._prevRect.y + this._prevRect.h) {
      this._page = Math.max(0, this._page - 1)
      return
    }
    if (this._nextRect && x >= this._nextRect.x && x <= this._nextRect.x + this._nextRect.w &&
        y >= this._nextRect.y && y <= this._nextRect.y + this._nextRect.h) {
      this._page = Math.min(Math.ceil(META_UPGRADES.length / 6) - 1, this._page + 1)
      return
    }
    if (x >= 300 && x <= 500 && y >= 492 && y <= 536) {
      this._page = 0
      GameState.screen = 'lobby'
    }
  },
}

window.MetaManager = MetaManager

window.addEventListener('click', (e) => {
  const canvas = document.getElementById('gameCanvas')
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  MetaManager.handleClick(
    (e.clientX - rect.left) * (800 / rect.width),
    (e.clientY - rect.top)  * (600 / rect.height)
  )
})
