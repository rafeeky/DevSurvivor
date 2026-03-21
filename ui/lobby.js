// 로비 배경 이미지 (bg_office.png)
const _lobbyBgImg = new Image()
_lobbyBgImg.src = 'assets/custom/backgrounds/bg_office.png'

class Lobby {
  constructor() {
    this._selected = localStorage.getItem('devSurvivor_char') || 'adam'
    // 카드 레이아웃: 3장 × 170px, gap 20px, 800px 중앙 정렬 → left=125
    this._cards = [
      { key: 'adam',   x: 125, y: 248, w: 170, h: 140 },
      { key: 'alex',   x: 315, y: 248, w: 170, h: 140 },
      { key: 'amelia', x: 505, y: 248, w: 170, h: 140 },
    ]
    this.startBtnRect   = { x: 275, y: 406, w: 250, h: 46 }
    this.upgradeBtnRect = { x: 300, y: 460, w: 200, h: 40 }
    this._bindClick()
  }

  _select(key) {
    this._selected = key
    localStorage.setItem('devSurvivor_char', key)
    if (window.GameState) GameState.selectedCharacter = key
  }

  _bindClick() {
    window.addEventListener('click', (e) => {
      if (GameState.screen !== 'lobby') return
      const canvas = document.getElementById('gameCanvas')
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (800 / rect.width)
      const y = (e.clientY - rect.top)  * (600 / rect.height)

      for (const card of this._cards) {
        if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
          this._select(card.key)
          return
        }
      }

      const s = this.startBtnRect
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
        Game.start(); return
      }
      const u = this.upgradeBtnRect
      if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) {
        GameState.screen = 'upgrade'
      }
    })
  }

  render(ctx) {
    if (GameState.screen !== 'lobby') return

    // GameState 동기화
    GameState.selectedCharacter = this._selected

    // 배경 (bg_office.png 또는 폴백 그리드)
    if (_lobbyBgImg.complete && _lobbyBgImg.naturalWidth > 0) {
      ctx.drawImage(_lobbyBgImg, 0, 0, _lobbyBgImg.naturalWidth, _lobbyBgImg.naturalHeight, 0, 0, 800, 600)
      ctx.fillStyle = 'rgba(0,0,20,0.68)'
      ctx.fillRect(0, 0, 800, 600)
    } else {
      ctx.fillStyle = '#0d0d1a'
      ctx.fillRect(0, 0, 800, 600)
      ctx.strokeStyle = '#1a1a3e'
      ctx.lineWidth = 1
      for (let x = 0; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke() }
      for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(800,y); ctx.stroke() }
    }

    // 타이틀
    ctx.textAlign = 'center'
    ctx.fillStyle = '#4488ff'
    ctx.font = 'bold 48px monospace'
    ctx.fillText('DEV', 400, 100)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px monospace'
    ctx.fillText('SURVIVAL', 400, 150)

    // 부제
    ctx.fillStyle = '#7788aa'
    ctx.font = '14px monospace'
    ctx.fillText('AI가 발전하는 세상에서, 오늘도 버텨야 한다', 400, 178)

    // 점수 / 포인트 (한 줄)
    const best = parseInt(localStorage.getItem('devsurvival_best') || '0')
    const pts  = window.MetaManager ? MetaManager.loadPoints() : 0
    ctx.fillStyle = '#FFD700'
    ctx.font = '13px monospace'
    ctx.fillText(`최고 기록: ${best.toLocaleString()}점`, 265, 202)
    ctx.fillStyle = '#88ffaa'
    ctx.fillText(`출시 포인트: ${pts}`, 535, 202)

    // 캐릭터 선택 헤더
    ctx.fillStyle = '#556677'
    ctx.font = '12px monospace'
    ctx.fillText('── 캐릭터 선택 ──', 400, 238)

    // 캐릭터 카드
    this._drawCharCards(ctx)

    // 시작 버튼
    const s = this.startBtnRect
    ctx.fillStyle = '#1e3a6e'
    ctx.strokeStyle = '#4488ff'
    ctx.lineWidth = 2
    ctx.fillRect(s.x, s.y, s.w, s.h)
    ctx.strokeRect(s.x, s.y, s.w, s.h)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px monospace'
    ctx.fillText('[ 시작하기 ]', 400, s.y + 30)

    // 업그레이드 버튼
    const u = this.upgradeBtnRect
    ctx.fillStyle = '#0d1a0d'
    ctx.strokeStyle = '#44aa44'
    ctx.lineWidth = 2
    ctx.fillRect(u.x, u.y, u.w, u.h)
    ctx.strokeRect(u.x, u.y, u.w, u.h)
    ctx.fillStyle = '#88ff88'
    ctx.font = 'bold 15px monospace'
    ctx.fillText('[ 업그레이드 ]', 400, u.y + 26)

    // 조작 안내
    ctx.fillStyle = '#556677'
    ctx.font = '12px monospace'
    ctx.fillText('WASD 이동  /  Q~R 스킬 사용', 400, 514)
    ctx.fillText('레벨업 시 1·2·3 키 또는 클릭으로 선택', 400, 532)

    ctx.textAlign = 'left'
  }

  _drawCharCards(ctx) {
    const configs = window.CHAR_CONFIGS || {}
    const sprites = window.CHAR_SPRITES || {}

    for (const card of this._cards) {
      const cfg = configs[card.key]
      const spr = sprites[card.key]
      const sel = this._selected === card.key
      const cx  = card.x + card.w / 2

      // 카드 배경
      ctx.fillStyle   = sel ? 'rgba(68,136,255,0.22)' : 'rgba(0,0,20,0.72)'
      ctx.strokeStyle = sel ? '#4488ff' : '#2a3a55'
      ctx.lineWidth   = sel ? 2 : 1
      ctx.fillRect(card.x, card.y, card.w, card.h)
      ctx.strokeRect(card.x, card.y, card.w, card.h)

      // 선택 표시 (우상단 ▶)
      if (sel) {
        ctx.fillStyle = '#4488ff'
        ctx.font = '9px monospace'
        ctx.textAlign = 'right'
        ctx.fillText('▶', card.x + card.w - 5, card.y + 12)
      }

      ctx.textAlign = 'center'

      // 캐릭터 프리뷰 — portrait 이미지 우선, 없으면 sprite row0 폴백
      const PREV = 96
      const px = Math.round(cx - PREV / 2)
      const py = card.y + 6
      const portImg = spr?.portrait
      if (portImg?.complete && portImg.naturalWidth > 0) {
        // portrait 이미지 (1024×1024 → 96×96 스케일)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(portImg, 0, 0, portImg.naturalWidth, portImg.naturalHeight, px, py, PREV, PREV)
        ctx.imageSmoothingEnabled = false
      } else {
        const idleImg = spr?.idle
        if (idleImg?.complete && idleImg.naturalWidth > 0 && cfg) {
          // idle 스프라이트 row0 = 정면 (front-facing)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(idleImg, 0, 0, cfg.idle.fw, cfg.idle.fh, px, py, PREV, PREV)
          ctx.imageSmoothingEnabled = true
        } else {
          // 로딩 전 플레이스홀더
          ctx.fillStyle = '#1a2240'
          ctx.fillRect(px, py, PREV, PREV)
          ctx.fillStyle = '#334466'
          ctx.font = '28px monospace'
          ctx.fillText('?', cx, py + 52)
        }
      }

      // 이름
      ctx.fillStyle = sel ? '#ffffff' : '#aabbcc'
      ctx.font = `bold 12px monospace`
      ctx.fillText(cfg?.label || card.key, cx, card.y + 112)

      // 서브라벨
      ctx.fillStyle = sel ? '#88aaff' : '#556677'
      ctx.font = '10px monospace'
      ctx.fillText(cfg?.sublabel || '', cx, card.y + 126)
    }

    ctx.textAlign = 'left'
  }
}

window.Lobby = Lobby
const _lobby = new Lobby()
window._lobby = _lobby
