// 로비 배경 이미지 (bg_office.png)
const _lobbyBgImg = new Image()
_lobbyBgImg.src = 'assets/custom/backgrounds/bg_office.png'

class Lobby {
  constructor() {
    this._selected = localStorage.getItem('devSurvivor_char') || 'adam'
    // 카드 레이아웃: 3장 × 170px, gap 20px, 800px 중앙 정렬 → left=125
    // 카드 높이 148px: 포트레이트 88 + 이름 16 + 역할배지 16 + 패시브 설명 16 + 여백
    this._cards = [
      { key: 'adam',   x: 125, y: 180, w: 170, h: 148 },
      { key: 'alex',   x: 315, y: 180, w: 170, h: 148 },
      { key: 'amelia', x: 505, y: 180, w: 170, h: 148 },
    ]
    this.startBtnRect   = { x: 210, y: 342, w: 380, h: 60 }
    this.upgradeBtnRect = { x: 255, y: 412, w: 290, h: 50 }
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
    ctx.font = 'bold 200px monospace'
    ctx.fillText('DEV', 400, 62)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('SURVIVOR', 400, 116)

    // 부제
    ctx.fillStyle = '#ffcc55'
    ctx.font = '22px "Pixelify Sans", sans-serif'
    ctx.fillText('AI가 발전하는 세상에서, 오늘도 버텨야 한다', 400, 140)

    // 점수 / 포인트 (한 줄)
    const best = parseInt(localStorage.getItem('devsurvival_best') || '0')
    const pts  = window.MetaManager ? MetaManager.loadPoints() : 0
    ctx.fillStyle = '#FFD700'
    ctx.font = '13px "Pixelify Sans", sans-serif'
    ctx.fillText(`최고 기록: ${best.toLocaleString()}점`, 265, 161)
    ctx.fillStyle = '#88ffaa'
    ctx.fillText(`출시 포인트: ${pts}`, 535, 161)

    // 캐릭터 선택 헤더
    ctx.fillStyle = '#556677'
    ctx.font = '12px "Pixelify Sans", sans-serif'
    ctx.fillText('── 캐릭터 선택 ──', 400, 181)

    // 캐릭터 카드
    this._drawCharCards(ctx)

    // 시작 버튼
    const s = this.startBtnRect
    ctx.fillStyle = '#1e3a6e'
    ctx.strokeStyle = '#4488ff'
    ctx.lineWidth = 2.5
    ctx.fillRect(s.x, s.y, s.w, s.h)
    ctx.strokeRect(s.x, s.y, s.w, s.h)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px "Pixelify Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('[ 시작하기 ]', s.x + s.w / 2, s.y + s.h / 2 + 8)

    // 업그레이드 버튼
    const u = this.upgradeBtnRect
    ctx.fillStyle = '#0d1a0d'
    ctx.strokeStyle = '#44aa44'
    ctx.lineWidth = 2
    ctx.fillRect(u.x, u.y, u.w, u.h)
    ctx.strokeRect(u.x, u.y, u.w, u.h)
    ctx.fillStyle = '#88ff88'
    ctx.font = 'bold 26px "Pixelify Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('[ 업그레이드 ]', u.x + u.w / 2, u.y + u.h / 2 + 8)

    // 조작 안내
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, 458, 800, 62)
    ctx.fillStyle = '#aaddff'
    ctx.font = '22px "Pixelify Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('WASD 이동  /  1~4 스킬 사용  /  레벨업: 1·2·3 키 또는 클릭', 400, 480)
    ctx.fillStyle = '#88aacc'
    ctx.font = '18px "Pixelify Sans", sans-serif'
    ctx.fillText('경험치를 모아 레벨업하고 스킬을 획득하세요', 400, 503)

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
        ctx.font = '9px "Pixelify Sans", sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('▶', card.x + card.w - 5, card.y + 12)
      }

      ctx.textAlign = 'center'

      // 캐릭터 프리뷰 — idle 스프라이트 frame0, portrait 효과
      const portraitH = card.h - 56  // 이름16 + 역할배지18 + 패시브설명16 + 여백6 = 56px 확보
      const portraitY = card.y + 2
      const idleImg = spr?.idle

      // 캐릭터별 배경색
      const charBg = { adam: '#0e1f3a', alex: '#0e2a3f', amelia: '#1a1230' }
      ctx.fillStyle = charBg[card.key] || '#111827'
      ctx.fillRect(card.x + 2, portraitY, card.w - 4, portraitH)

      if (idleImg?.complete && idleImg.naturalWidth > 0 && cfg?.idle) {
        const fw = cfg.idle.fw
        const fh = cfg.idle.fh
        let dispW, dispH, drawX, drawY
        if (fw <= 16) {
          // 소형 픽셀 아트 스프라이트: 높이 기준 스케일, 중앙 정렬, 픽셀 완벽 렌더링
          const scale = (portraitH - 4) / fh
          dispH = portraitH - 4
          dispW = fw * scale
          drawX = card.x + (card.w - dispW) / 2
          drawY = portraitY + 2
        } else {
          // 대형 스프라이트: 높이에 맞춰 스케일 → 수평 중앙 정렬
          const scaleToH = (portraitH - 4) / fh
          dispH = portraitH - 4
          dispW = fw * scaleToH
          drawX = card.x + (card.w - dispW) / 2
          drawY = portraitY + 2
        }
        ctx.save()
        ctx.beginPath()
        ctx.rect(card.x, card.y, card.w, portraitH)
        ctx.clip()
        if (fw <= 16) {
          // 소형 스프라이트 후광 (16x16 픽셀아트 캐릭터 가시성 향상)
          const glowCX = drawX + dispW / 2
          const glowCY = drawY + dispH / 2
          const glowR  = dispW * 0.6
          const grd = ctx.createRadialGradient(glowCX, glowCY, 0, glowCX, glowCY, glowR)
          grd.addColorStop(0,   'rgba(180,210,255,0.18)')
          grd.addColorStop(0.5, 'rgba(120,170,255,0.08)')
          grd.addColorStop(1,   'rgba(0,0,0,0)')
          ctx.fillStyle = grd
          ctx.fillRect(drawX, drawY, dispW, dispH)
        }
        ctx.imageSmoothingEnabled = fw > 16
        ctx.imageSmoothingQuality = fw > 16 ? 'high' : 'low'
        ctx.drawImage(idleImg, 0, 0, fw, fh, drawX, drawY, dispW, dispH)
        ctx.imageSmoothingEnabled = false
        ctx.restore()
      } else {
        // 로딩 전 플레이스홀더
        ctx.fillStyle = '#334466'
        ctx.font = '28px "Pixelify Sans", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('?', cx, portraitY + portraitH / 2 + 10)
      }

      // 이름
      ctx.fillStyle = sel ? '#ffffff' : '#aabbcc'
      ctx.font = 'bold 11px "Pixelify Sans", sans-serif'
      ctx.fillText(cfg?.label || card.key, cx, card.y + card.h - 40)

      // 역할 타입 배지
      const roleType  = cfg?.roleType || ''
      const roleColor = cfg?.roleColor || '#888888'
      if (roleType) {
        const badgeW = 64, badgeH = 14
        const badgeX = cx - badgeW / 2
        const badgeY = card.y + card.h - 34
        ctx.fillStyle = roleColor + '33'
        ctx.strokeStyle = roleColor
        ctx.lineWidth = 1
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH)
        ctx.fillStyle = roleColor
        ctx.font = 'bold 9px "Pixelify Sans", sans-serif'
        ctx.fillText(roleType, cx, badgeY + 10)
      }

      // 패시브명
      ctx.fillStyle = sel ? '#ccbbff' : '#556677'
      ctx.font = '9px "Pixelify Sans", sans-serif'
      ctx.fillText(cfg?.sublabel || '', cx, card.y + card.h - 4)
    }

    ctx.textAlign = 'left'
  }
}

window.Lobby = Lobby
const _lobby = new Lobby()
window._lobby = _lobby
