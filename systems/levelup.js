// systems/levelup.js
// Haon — Player Skill & Progression Designer
// 경험치/레벨업 시스템 (M1~M2 스코프)

// skillId → 아이콘 파일 매핑
const _LU_ICON_BY_ID = {
  '긴급수정':    'assets/custom/icons/skill_emergency_fix.png',
  '디버그':      'assets/custom/icons/skill_debug.png',
  '우선순위정리':'assets/custom/icons/skill_sing.png',       // 변경: priority_sort → sing
  '커피':        'assets/custom/icons/skill_coffee.png',
  '피규어청소':  'assets/custom/icons/skill_mental.png',     // 변경: figure_clean → mental
  '강아지':      'assets/custom/icons/skill_pet_dog.png',
  '낮잠':        'assets/custom/icons/skill_nap.png',
  '자동저장':    'assets/custom/icons/skill_autosave.png',
  '산책':        'assets/custom/icons/skill_walk.png',       // 신규 추가
}
const _luIconCache = {}
function _getLUIcon(skillId) {
  if (!skillId) return null
  const src = _LU_ICON_BY_ID[skillId]
  if (!src) return null
  if (!_luIconCache[skillId]) {
    const img = new Image(); img.src = src
    _luIconCache[skillId] = img
  }
  return _luIconCache[skillId]
}

// ---------------------------------------------------------------------------
// ctx.roundRect 폴리필 (구형 브라우저 대비)
// ---------------------------------------------------------------------------
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2)
    this.moveTo(x + radius, y)
    this.lineTo(x + w - radius, y)
    this.arcTo(x + w, y, x + w, y + radius, radius)
    this.lineTo(x + w, y + h - radius)
    this.arcTo(x + w, y + h, x + w - radius, y + h, radius)
    this.lineTo(x + radius, y + h)
    this.arcTo(x, y + h, x, y + h - radius, radius)
    this.lineTo(x, y + radius)
    this.arcTo(x, y, x + radius, y, radius)
    this.closePath()
    return this
  }
}

// ---------------------------------------------------------------------------
// 경험치 커브 (GDD Part 5.1)
// index = 레벨 (1~8), value = 해당 레벨 달성에 필요한 누적 경험치
// ---------------------------------------------------------------------------
const EXP_THRESHOLDS = [0, 30, 80, 160, 280, 450, 650, 900, 1200]

// ---------------------------------------------------------------------------
// 레벨업 선택지 정의
// ---------------------------------------------------------------------------
const LEVEL_UP_CHOICES = {
  // 신규 스킬
  '긴급수정_신규': {
    label: '긴급 패치',
    desc: '주변 범위 공격 (반경 120px, 피해 40) [LV.1]',
    type: 'newSkill',
    skillId: '긴급수정',
  },
  '디버그_신규': {
    label: '디버그',
    desc: '가장 가까운 적 단일 고화력 (피해 70)',
    type: 'newSkill',
    skillId: '디버그',
  },
  // 기존 스킬 강화
  '긴급수정_강화': {
    label: '긴급 패치 강화',
    desc: 'LV.2: 피해+20 / LV.MAX: 범위+40px',
    type: 'upgradeSkill',
    skillId: '긴급수정',
  },
  '디버그_강화': {
    label: '디버그 강화',
    desc: 'LV.2: 피해+30 / LV.MAX: 2명 관통',
    type: 'upgradeSkill',
    skillId: '디버그',
  },
  '우선순위정리_강화': {
    label: '고성방가 강화',
    desc: 'LV.2: 피해+15 / LV.MAX: 범위+20px·쿨 4초',
    type: 'upgradeSkill',
    skillId: '우선순위정리',
  },
  '커피_강화': {
    label: '커피 한 잔 강화',
    desc: 'LV.2: 속도+60%·쿨감소↑ / LV.MAX: 지속 8초',
    type: 'upgradeSkill',
    skillId: '커피',
  },
  '피규어청소_강화': {
    label: '멘탈관리 강화',
    desc: 'LV.2: 피해감소 50%·5초 / LV.MAX: 넉백범위+60px·HP+10%',
    type: 'upgradeSkill',
    skillId: '피규어청소',
  },
  '강아지_강화': {
    label: '쓰다듬기 강화',
    desc: 'LV.2: HP 35% 회복 / LV.MAX: 보호막 +1',
    type: 'upgradeSkill',
    skillId: '강아지',
  },
  '낮잠_강화': {
    label: '낮잠자기 강화',
    desc: 'LV.2: HP 65% 회복 / LV.MAX: 정지 1초로 단축',
    type: 'upgradeSkill',
    skillId: '낮잠',
  },
  // 기본 능력 강화
  'hp강화': {
    label: 'HP +15',
    desc: '최대 체력이 15 증가합니다',
    type: 'statBoost',
    apply: (player) => { player.maxHp += 15; player.hp = Math.min(player.hp + 15, player.maxHp) },
  },
  'speed강화': {
    label: '이동속도 +20',
    desc: '이동 속도가 20px/s 증가합니다',
    type: 'statBoost',
    apply: (player) => { player.baseSpeed += 20 },
  },
  // M4 액티브 스킬
  '우선순위정리_신규': {
    label: '고성방가',
    desc: '전방 부채꼴 160px, 피해 30, 넉백 100px [LV.1]',
    type: 'newSkill',
    skillId: '우선순위정리',
  },
  '커피_신규': {
    label: '커피 한 잔',
    desc: '속도 +40% (5초), 쿨다운 -20%, 쿨 20초',
    type: 'newSkill',
    skillId: '커피',
  },
  '피규어청소_신규': {
    label: '멘탈관리',
    desc: '피해 감소 40% (4초) + 주변 적 넉백 [LV.1]',
    type: 'newSkill',
    skillId: '피규어청소',
  },
  '강아지_신규': {
    label: '쓰다듬기',
    desc: '최대 HP 25% 즉시 회복 [LV.1]',
    type: 'newSkill',
    skillId: '강아지',
  },
  '낮잠_신규': {
    label: '낮잠자기',
    desc: '1.5초 정지 후 HP 50% 회복, 쿨 30초',
    type: 'newSkill',
    skillId: '낮잠',
  },
  // M4 패시브 스킬
  '자동저장_신규': {
    label: '자동 저장',
    desc: '12초마다 보호막 자동 충전 (패시브)',
    type: 'passiveSkill',
    skillId: '자동저장',
  },
  '산책_신규': {
    label: '산책하기',
    desc: '이동속도 +30% 영구 증가 (패시브)',
    type: 'passiveSkill',
    skillId: '산책',
  },
}

// ---------------------------------------------------------------------------
// LevelUpManager
// ---------------------------------------------------------------------------
class LevelUpManager {
  constructor() {
    this.pendingLevelUp = false
    this.choices = []
    this.choiceRects = []    // 클릭 감지용 { x, y, w, h }
    this._checkLevel = 1
  }

  update() {
    if (this.pendingLevelUp) return
    const lvl = GameState.playerLevel
    if (lvl >= EXP_THRESHOLDS.length) return  // 최대 레벨
    const needed = EXP_THRESHOLDS[lvl]        // 다음 레벨 필요 누적 경험치
    if (GameState.playerExp >= needed) {
      GameState.playerLevel++
      this._triggerLevelUp()
    }
  }

  _triggerLevelUp() {
    this.pendingLevelUp = true
    this.flashStartTime = performance.now()
    this.choices = this._generateChoices()
    Game.pause()
  }

  _generateChoices() {
    const sm = Game.skillManager
    const ownedSlots = sm ? sm.slots.filter(Boolean) : []
    const activePassives = sm ? [...sm.passives] : []
    const hasEmptySlot = sm ? sm.slots.some(s => s === null) : false
    const choices = []

    // 미보유 액티브 스킬 신규 선택지 (빈 슬롯 있을 때만)
    if (hasEmptySlot) {
      if (!ownedSlots.includes('긴급수정'))    choices.push(LEVEL_UP_CHOICES['긴급수정_신규'])
      if (!ownedSlots.includes('디버그'))      choices.push(LEVEL_UP_CHOICES['디버그_신규'])
      if (!ownedSlots.includes('우선순위정리')) choices.push(LEVEL_UP_CHOICES['우선순위정리_신규'])
      if (!ownedSlots.includes('커피'))        choices.push(LEVEL_UP_CHOICES['커피_신규'])
      if (!ownedSlots.includes('피규어청소'))  choices.push(LEVEL_UP_CHOICES['피규어청소_신규'])
      if (!ownedSlots.includes('강아지'))      choices.push(LEVEL_UP_CHOICES['강아지_신규'])
      if (!ownedSlots.includes('낮잠'))        choices.push(LEVEL_UP_CHOICES['낮잠_신규'])
    }

    // 보유 스킬 강화 선택지 (레벨 3 미만인 경우만)
    const sm2 = Game.skillManager
    if (ownedSlots.includes('긴급수정')) {
      const lv = sm2?.skillDefs?.['긴급수정']?.level || 1
      if (lv < 3) choices.push(LEVEL_UP_CHOICES['긴급수정_강화'])
    }
    if (ownedSlots.includes('디버그')) {
      const lv = sm2?.skillDefs?.['디버그']?.level || 1
      if (lv < 3) choices.push(LEVEL_UP_CHOICES['디버그_강화'])
    }
    if (ownedSlots.includes('우선순위정리')) {
      const lv = sm2?.skillDefs?.['우선순위정리']?.level || 1
      if (lv < 3) choices.push(LEVEL_UP_CHOICES['우선순위정리_강화'])
    }
    if (ownedSlots.includes('커피')) {
      const lv = sm2?.skillDefs?.['커피']?.level || 1
      if (lv < 3) choices.push(LEVEL_UP_CHOICES['커피_강화'])
    }
    if (ownedSlots.includes('피규어청소')) {
      const lv = sm2?.skillDefs?.['피규어청소']?.level || 1
      if (lv < 3) choices.push(LEVEL_UP_CHOICES['피규어청소_강화'])
    }
    if (ownedSlots.includes('강아지')) {
      const lv = sm2?.skillDefs?.['강아지']?.level || 1
      if (lv < 3) choices.push(LEVEL_UP_CHOICES['강아지_강화'])
    }
    if (ownedSlots.includes('낮잠')) {
      const lv = sm2?.skillDefs?.['낮잠']?.level || 1
      if (lv < 3) choices.push(LEVEL_UP_CHOICES['낮잠_강화'])
    }

    // 미보유 패시브 스킬
    if (!activePassives.includes('자동저장')) choices.push(LEVEL_UP_CHOICES['자동저장_신규'])
    if (!activePassives.includes('산책'))     choices.push(LEVEL_UP_CHOICES['산책_신규'])

    // 기본 능력 강화 (항상 풀에 포함)
    choices.push(LEVEL_UP_CHOICES['hp강화'])
    choices.push(LEVEL_UP_CHOICES['speed강화'])

    // 랜덤 3개 선택
    const shuffled = choices.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  }

  applyChoice(index) {
    if (index < 0 || index >= this.choices.length) return
    const choice = this.choices[index]
    const sm = Game.skillManager
    const player = Game.player

    if (choice.type === 'newSkill' && sm) {
      const emptySlot = sm.slots.findIndex(s => s === null)
      if (emptySlot !== -1) sm.assignSkill(emptySlot, choice.skillId)
    } else if (choice.type === 'upgradeSkill' && sm) {
      sm.upgradeSkill(choice.skillId)
    } else if (choice.type === 'passiveSkill' && sm) {
      sm.assignPassive(choice.skillId)
    } else if (choice.type === 'statBoost' && player) {
      choice.apply(player)
    }

    this.pendingLevelUp = false
    this.choices = []
    this.choiceRects = []
    Game.resume()
  }

  handleClick(x, y) {
    if (!this.pendingLevelUp) return
    for (let i = 0; i < this.choiceRects.length; i++) {
      const r = this.choiceRects[i]
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        this.applyChoice(i)
        return
      }
    }
  }

  render(ctx) {
    if (!this.pendingLevelUp) return

    // 황금빛 광원 플래시 (0.4초)
    const elapsed = (performance.now() - this.flashStartTime) / 1000
    if (elapsed < 0.4) {
      const flashAlpha = (1 - elapsed / 0.4) * 0.7
      const grad = ctx.createRadialGradient(400, 300, 0, 400, 300, 400)
      grad.addColorStop(0, `rgba(255, 215, 0, ${flashAlpha})`)
      grad.addColorStop(0.5, `rgba(255, 160, 0, ${flashAlpha * 0.4})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 800, 600)
    }

    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(0, 0, 800, 600)

    // 제목
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 36px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`Level Up!  Lv ${GameState.playerLevel - 1} → ${GameState.playerLevel}`, 400, 160)

    ctx.font = '18px "VT323", monospace'
    ctx.fillStyle = '#aaaaaa'
    ctx.fillText('클릭하거나 1 / 2 / 3 키로 선택하세요', 400, 190)

    // 카드 3개
    this.choiceRects = []
    const cardW = 220, cardH = 270
    const startX = 400 - (cardW * 1.5 + 20)

    for (let i = 0; i < this.choices.length; i++) {
      const c = this.choices[i]
      const cx = startX + i * (cardW + 20)
      const cy = 200

      // 카드 배경 — ui-pack-4 다크 패널 (9-slice)
      if (window.drawUIPanel) {
        drawUIPanel(ctx, cx, cy, cardW, cardH)
      } else {
        ctx.fillStyle = '#1e2a4a'
        ctx.strokeStyle = '#4466aa'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(cx, cy, cardW, cardH, 8)
        ctx.fill()
        ctx.stroke()
      }

      // ── 상단 아이콘 박스 (카드 상단 중앙) ────────────────────────────
      const icon = _getLUIcon(c.skillId)
      const iconSize = 80
      const iconX = cx + (cardW - iconSize) / 2
      const iconY = cy + 22
      // 박스 배경
      ctx.fillStyle = 'rgba(10,20,55,0.9)'
      ctx.fillRect(iconX, iconY, iconSize, iconSize)
      ctx.strokeStyle = c.skillId ? '#4488cc' : '#2a3a55'
      ctx.lineWidth = 1.5
      ctx.strokeRect(iconX, iconY, iconSize, iconSize)
      if (icon?.complete && icon.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(icon, 0, 0, icon.naturalWidth, icon.naturalHeight, iconX + 4, iconY + 4, iconSize - 8, iconSize - 8)
        ctx.imageSmoothingEnabled = false
      } else if (c.skillId) {
        // 로딩 중 플레이스홀더
        ctx.fillStyle = 'rgba(68,102,170,0.25)'
        ctx.fillRect(iconX + 4, iconY + 4, iconSize - 8, iconSize - 8)
      }

      // 키 레이블 (좌상단)
      const cardKeys = ['1', '2', '3']
      ctx.fillStyle = '#aaccff'
      ctx.font = 'bold 15px "VT323", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`[${cardKeys[i]}]`, cx + 8, cy + 18)

      // 스킬 이름 (아이콘 아래 중앙)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(c.label, cx + cardW / 2, cy + 118)

      // 구분선
      ctx.strokeStyle = 'rgba(80,120,200,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx + 10, cy + 128)
      ctx.lineTo(cx + cardW - 10, cy + 128)
      ctx.stroke()

      // 설명 (슬래시·불릿 기준 줄바꿈 + 긴 줄 wrapText)
      ctx.fillStyle = '#aabbdd'
      ctx.font = '13px "VT323", monospace'
      ctx.textAlign = 'left'
      const _descMaxW = cardW - 24
      const descParts = c.desc.split(/\s*\/\s*|\s*•\s*/).filter(Boolean)
      let lineY = cy + 148
      for (const part of descParts) {
        if (lineY > cy + cardH - 12) break
        // 긴 줄 단어 단위 줄바꿈
        const words = part.trim().split(' ')
        let line = ''
        for (const word of words) {
          const test = line ? line + ' ' + word : word
          if (ctx.measureText(test).width > _descMaxW && line) {
            if (lineY <= cy + cardH - 12) ctx.fillText(line, cx + 12, lineY)
            lineY += 18
            line = word
          } else {
            line = test
          }
        }
        if (line && lineY <= cy + cardH - 12) ctx.fillText(line, cx + 12, lineY)
        lineY += 18
      }

      this.choiceRects.push({ x: cx, y: cy, w: cardW, h: cardH })

      // 카드 하단 화살표 버튼 힌트 (ui-pack-4 Arrows)
      if (window.drawUIArrow) {
        const arrowY = cy + cardH + 6
        const arrowSize = 20
        // 왼쪽 카드 → 왼쪽 화살표, 오른쪽 카드 → 오른쪽 화살표, 가운데는 양쪽
        if (i === 0) drawUIArrow(ctx, 'right', 'purple', cx + cardW - arrowSize - 4, arrowY, arrowSize)
        if (i === 1) {
          drawUIArrow(ctx, 'left',  'purple', cx + 4,             arrowY, arrowSize)
          drawUIArrow(ctx, 'right', 'purple', cx + cardW - arrowSize - 4, arrowY, arrowSize)
        }
        if (i === 2) drawUIArrow(ctx, 'left', 'purple', cx + 4, arrowY, arrowSize)
      }
    }

    ctx.textAlign = 'left'
  }

}

// ---------------------------------------------------------------------------
// 전역 노출 및 이벤트 등록
// ---------------------------------------------------------------------------

window.LevelUpManager = LevelUpManager

const _levelUpManager = new LevelUpManager()
window._levelUpManager = _levelUpManager

// 클릭 이벤트 등록
window.addEventListener('click', (e) => {
  const canvas = document.getElementById('gameCanvas')
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = 800 / rect.width
  const scaleY = 600 / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  _levelUpManager.handleClick(x, y)
})

// 키보드 1/2/3 선택
window.addEventListener('keydown', (e) => {
  if (!_levelUpManager.pendingLevelUp) return
  if (e.code === 'Digit1') _levelUpManager.applyChoice(0)
  if (e.code === 'Digit2') _levelUpManager.applyChoice(1)
  if (e.code === 'Digit3') _levelUpManager.applyChoice(2)
})
