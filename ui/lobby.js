// 로비 배경 이미지 (bg_title.png)
const _lobbyBgImg = new Image()
_lobbyBgImg.src = 'assets/backgrounds/bg_title.png'

class Lobby {
  constructor() {
    let saved = localStorage.getItem('devSurvivor_char') || 'adam'
    if (saved === 'alex') saved = 'adam'  // alex removed
    this._selected = saved
    // 카드 레이아웃: 3장 × 170px, gap 20px, 800px 중앙 정렬 → left=125
    // 카드 높이 168px: 포트레이트 108 + 이름 16 + 역할배지 16 + 패시브 설명 16 + 여백 12
    this._cards = [
      { key: 'adam',   x: 125, y: 180, w: 170, h: 168 },
      { key: 'amelia', x: 315, y: 180, w: 170, h: 168 },
      { key: 'vampir', x: 505, y: 180, w: 170, h: 168 },
    ]
    this.startBtnRect   = { x: 210, y: 362, w: 380, h: 60 }
    this.upgradeBtnRect = { x: 290, y: 436, w: 220, h: 34 }
    this._usernameInput = null
    this._usernameModalActive = false
    this._lobbyBgmPlaying = false
    this._initUsernameInput()
    this._bindClick()
  }

  _initUsernameInput() {
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 12
    input.placeholder = '닉네임 입력 (최대 12자)'
    input.id = 'devsurvival-username-input'
    input.value = localStorage.getItem('devsurvival_username') || ''
    Object.assign(input.style, {
      position:        'absolute',
      zIndex:          '10',
      display:         'none',
      fontSize:        '15px',
      fontFamily:      '"VT323", monospace',
      color:           '#ffffff',
      background:      'rgba(10,20,50,0.88)',
      border:          '1.5px solid #4488ff',
      borderRadius:    '4px',
      padding:         '4px 8px',
      outline:         'none',
      boxShadow:       '0 0 8px rgba(68,136,255,0.5)',
      letterSpacing:   '1px',
      textAlign:       'center',
      width:           '160px',
      boxSizing:       'border-box',
    })
    input.addEventListener('blur', () => {
      let val = input.value.trim().slice(0, 12)
      if (!val) val = ''
      input.value = val
      if (val) {
        localStorage.setItem('devsurvival_username', val)
        // 모달 모드였으면 게임 시작
        if (this._usernameModalActive) {
          this._usernameModalActive = false
          this._hideUsernameInput()
          Game.start()
        }
      }
    })
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur()
    })
    document.body.appendChild(input)
    this._usernameInput = input
  }

  _showUsernameInput() {
    const input = this._usernameInput
    if (!input) return
    const canvas = document.getElementById('gameCanvas')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // canvas 상에서 username input 박스 목표 위치 (canvas 좌표 기준: x=320, y=530)
    const scaleX = rect.width  / 800
    const scaleY = rect.height / 600
    const inputW = 160 * scaleX
    const inputH = 26  * scaleY
    const canvasX = (800 / 2 - 80) * scaleX  // 중앙 정렬
    const canvasY = 530 * scaleY
    input.style.left    = (rect.left + window.scrollX + canvasX) + 'px'
    input.style.top     = (rect.top  + window.scrollY + canvasY) + 'px'
    input.style.width   = inputW + 'px'
    input.style.height  = inputH + 'px'
    input.style.fontSize = Math.max(10, Math.round(14 * scaleY)) + 'px'
    input.style.display = 'block'
    input.value = localStorage.getItem('devsurvival_username') || ''
  }

  _hideUsernameInput() {
    if (this._usernameInput) this._usernameInput.style.display = 'none'
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
          if (!window.MetaManager?.isUnlocked(card.key)) return
          this._select(card.key)
          return
        }
      }

      const s = this.startBtnRect
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
        const existing = localStorage.getItem('devsurvival_username')?.trim()
        if (existing) {
          Game.start()
        } else {
          // username 미설정 → 모달 모드 진입
          this._usernameModalActive = true
          this._showUsernameInput()
          if (this._usernameInput) this._usernameInput.focus()
        }
        return
      }
      const u = this.upgradeBtnRect
      if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) {
        GameState.screen = 'upgrade'
      }
    })
  }

  render(ctx) {
    if (GameState.screen !== 'lobby') {
      this._hideUsernameInput()
      // 로비 BGM 정지
      if (this._lobbyBgmPlaying) {
        this._lobbyBgmPlaying = false
        window.GameAudio?.stopBGM()
      }
      return
    }
    // 로비 BGM 시작 (처음 진입 시 1회)
    if (!this._lobbyBgmPlaying) {
      this._lobbyBgmPlaying = true
      window.GameAudio?.startLobbyBGM()
    }

    // GameState 동기화
    GameState.selectedCharacter = this._selected

    // 배경 (bg_office.png 또는 폴백 그리드)
    if (_lobbyBgImg.complete && _lobbyBgImg.naturalWidth > 0) {
      ctx.drawImage(_lobbyBgImg, 0, 0, _lobbyBgImg.naturalWidth, _lobbyBgImg.naturalHeight, 0, 0, 800, 600)
      ctx.fillStyle = 'rgba(0,0,10,0.22)'
      ctx.fillRect(0, 0, 800, 600)
    } else {
      ctx.fillStyle = '#0d0d1a'
      ctx.fillRect(0, 0, 800, 600)
      ctx.strokeStyle = '#1a1a3e'
      ctx.lineWidth = 1
      for (let x = 0; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke() }
      for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(800,y); ctx.stroke() }
    }

    // CRT 모니터 데코 (좌/우 배치, 타이틀 높이에 맞춤)
    if (window.drawUIMonitor) {
      const mw = 104, mh = 85
      drawUIMonitor(ctx, 14,  20, mw, mh)   // 좌측
      drawUIMonitor(ctx, 682, 20, mw, mh)   // 우측
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
    ctx.font = '22px "VT323", monospace'
    ctx.fillText('AI가 발전하는 세상에서, 오늘도 버텨야 한다', 400, 140)

    // 점수 / 포인트 (한 줄)
    const best = parseInt(localStorage.getItem('devsurvival_best') || '0')
    const pts  = window.MetaManager ? MetaManager.loadPoints() : 0
    ctx.fillStyle = '#FFD700'
    ctx.font = '15px "VT323", monospace'
    ctx.fillText(`최고 기록: ${best.toLocaleString()}점`, 230, 161)
    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 16px "VT323", monospace'
    ctx.fillText(`출시 포인트: ${pts}`, 510, 161)

    // gold_4 보유량 표시 (뱀파이어 해금 재화)
    const g4 = parseInt(localStorage.getItem('devSurvivor_gold4') || '0')
    if (g4 > 0 || window.MetaManager?.isUnlocked('vampir')) {
      ctx.fillStyle = '#aa44ff'
      ctx.font = '12px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`gold_4 × ${g4}  (뱀파이어 해금: gold_4 1개)`, 400, 175)
    }

    // 캐릭터 선택 헤더
    ctx.fillStyle = '#556677'
    ctx.font = '12px "VT323", monospace'
    ctx.fillText('── 캐릭터 선택 ──', 400, 181)

    // 캐릭터 카드
    this._drawCharCards(ctx)

    // 시작 버튼 (메인 CTA — gradient rect)
    const s = this.startBtnRect
    ctx.save()
    ctx.shadowColor = '#4488ff'
    ctx.shadowBlur = 14
    const sGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h)
    sGrad.addColorStop(0, '#1e4a90')
    sGrad.addColorStop(1, '#0d2450')
    ctx.fillStyle = sGrad
    ctx.strokeStyle = '#66aaff'
    ctx.lineWidth = 2
    ctx.fillRect(s.x, s.y, s.w, s.h)
    ctx.strokeRect(s.x, s.y, s.w, s.h)
    ctx.restore()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('[ 시작하기 ]', s.x + s.w / 2, s.y + s.h / 2 + 8)

    // 업그레이드 버튼 (보조 — gradient rect)
    const u = this.upgradeBtnRect
    const uGrad = ctx.createLinearGradient(u.x, u.y, u.x, u.y + u.h)
    uGrad.addColorStop(0, '#1a3a1a')
    uGrad.addColorStop(1, '#0a1e0a')
    ctx.fillStyle = uGrad
    ctx.strokeStyle = '#55aa55'
    ctx.lineWidth = 1.5
    ctx.fillRect(u.x, u.y, u.w, u.h)
    ctx.strokeRect(u.x, u.y, u.w, u.h)
    ctx.fillStyle = '#77cc77'
    ctx.font = '18px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('업그레이드', u.x + u.w / 2, u.y + u.h / 2 + 6)

    // 조작 안내 (1줄로 축소)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 488, 800, 32)
    ctx.fillStyle = '#7799bb'
    ctx.font = '16px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('이동: 방향키  /  스킬: Q/W/E/R  /  레벨업 시 스킬 선택', 400, 508)

    // Username 표시 (로비 하단, 클릭 불가 — 정보 표시용)
    const uname = localStorage.getItem('devsurvival_username') || null
    if (uname) {
      ctx.fillStyle = '#8899bb'
      ctx.font = '12px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`👤 ${uname}`, 400, 572)
      ctx.fillStyle = '#445566'
      ctx.font = '10px "VT323", monospace'
      ctx.fillText('저장은 이 기기에만 적용됩니다', 400, 585)
    } else {
      ctx.fillStyle = '#667788'
      ctx.font = '12px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('시작하기를 누르면 닉네임을 입력할 수 있습니다', 400, 572)
    }

    // 모달 모드: 반투명 오버레이 + 안내 텍스트
    if (this._usernameModalActive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#aaccff'
      ctx.font = 'bold 22px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('닉네임을 입력하세요 (최대 12자)', 400, 270)
      ctx.fillStyle = '#778899'
      ctx.font = '14px "VT323", monospace'
      ctx.fillText('Enter 키로 확인', 400, 300)
      this._showUsernameInput()  // 모달 위치 갱신
    }

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

      // 카드 배경 (선택된 카드 글로우 강조)
      if (sel) {
        ctx.save()
        ctx.shadowColor = '#4488ff'
        ctx.shadowBlur = 14
        ctx.fillStyle = 'rgba(68,136,255,0.28)'
        ctx.strokeStyle = '#66aaff'
        ctx.lineWidth = 2.5
        ctx.fillRect(card.x, card.y, card.w, card.h)
        ctx.strokeRect(card.x, card.y, card.w, card.h)
        ctx.restore()
      } else {
        ctx.fillStyle = 'rgba(0,0,20,0.72)'
        ctx.strokeStyle = '#2a3a55'
        ctx.lineWidth = 1
        ctx.fillRect(card.x, card.y, card.w, card.h)
        ctx.strokeRect(card.x, card.y, card.w, card.h)
      }

      // 선택 표시 (우상단 ▶)
      if (sel) {
        ctx.fillStyle = '#4488ff'
        ctx.font = '9px "VT323", monospace'
        ctx.textAlign = 'right'
        ctx.fillText('▶', card.x + card.w - 5, card.y + 12)
      }

      ctx.textAlign = 'center'

      // 캐릭터 프리뷰 — idle 스프라이트 frame0, portrait 효과
      const portraitH = card.h - 56  // 이름16 + 역할배지18 + 패시브설명16 + 여백6 = 56px 확보
      const portraitY = card.y + 2
      const idleImg = spr?.idle

      // 캐릭터별 배경색
      const charBg = { adam: '#0e1f3a', amelia: '#1a1230', vampir: '#1a0a2e' }
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
        ctx.font = '28px "VT323", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('?', cx, portraitY + portraitH / 2 + 10)
      }

      // 이름
      ctx.fillStyle = sel ? '#ffffff' : '#aabbcc'
      ctx.font = 'bold 15px "VT323", monospace'
      ctx.fillText(cfg?.label || card.key, cx, card.y + card.h - 42)

      // 역할 타입 배지
      const roleType  = cfg?.roleType || ''
      const roleColor = cfg?.roleColor || '#888888'
      if (roleType) {
        const badgeW = 72, badgeH = 16
        const badgeX = cx - badgeW / 2
        const badgeY = card.y + card.h - 36
        ctx.fillStyle = roleColor + '33'
        ctx.strokeStyle = roleColor
        ctx.lineWidth = 1
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH)
        ctx.fillStyle = roleColor
        ctx.font = 'bold 12px "VT323", monospace'
        ctx.fillText(roleType, cx, badgeY + 12)
      }

      // 패시브명
      ctx.fillStyle = sel ? '#ccbbff' : '#7788aa'
      ctx.font = '12px "VT323", monospace'
      ctx.fillText(cfg?.sublabel || '', cx, card.y + card.h - 4)

      // 잠금 오버레이
      if (!window.MetaManager?.isUnlocked(card.key)) {
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.82)'
        ctx.fillRect(card.x, card.y, card.w, card.h)
        ctx.textAlign = 'center'
        // 캐릭터 이름 (상단 강조)
        ctx.fillStyle = '#ee88ff'
        ctx.font = 'bold 20px "VT323", monospace'
        ctx.fillText(cfg?.label || card.key, cx, card.y + 24)
        // 구분선
        ctx.strokeStyle = '#663388'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(card.x + 10, card.y + 30)
        ctx.lineTo(card.x + card.w - 10, card.y + 30)
        ctx.stroke()
        // 잠금 아이콘
        ctx.font = '30px "VT323", monospace'
        ctx.fillText('🔒', cx, card.y + 64)
        // 해금 안내
        ctx.fillStyle = '#cc88ff'
        ctx.font = 'bold 13px "VT323", monospace'
        ctx.fillText('보스 처치 후', cx, card.y + 90)
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 12px "VT323", monospace'
        ctx.fillText('골드 다이아 × 1 획득', cx, card.y + 108)
        ctx.fillStyle = '#aa88ff'
        ctx.font = '11px "VT323", monospace'
        ctx.fillText('→ 자동 해금됩니다', cx, card.y + 124)
        ctx.restore()
      }
    }

    ctx.textAlign = 'left'
  }
}

window.Lobby = Lobby
const _lobby = new Lobby()
window._lobby = _lobby
