// 로비 배경 이미지 (bg_title.png)
const _lobbyBgImg = new Image()
_lobbyBgImg.src = 'assets/backgrounds/bg_title.png'

class Lobby {
  constructor() {
    let saved = localStorage.getItem('devSurvivor_char') || 'adam'
    if (saved === 'alex') saved = 'adam'  // alex removed
    this._selected = saved
    // 카드 레이아웃: 3장 × 153px, 왼쪽 패널 (x=8~495)
    this._cards = [
      { key: 'adam',   x: 8,   y: 142, w: 153, h: 330 },
      { key: 'amelia', x: 175, y: 142, w: 153, h: 330 },
      { key: 'vampir', x: 342, y: 142, w: 153, h: 330 },
    ]
    this.startBtnRect   = { x: 510, y: 216, w: 275, h: 54 }
    this.upgradeBtnRect = { x: 510, y: 284, w: 275, h: 46 }
    this.renameBtnRect  = { x: 510, y: 408, w: 275, h: 34 }
    this._usernameInput = null
    this._usernameModalActive = false
    this._renameMode = false
    this._lobbyBgmPlaying = false
    this._initUsernameInput()
    this._bindClick()
  }

  _initUsernameInput() {
    // ── 텍스트 입력창 ──
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 12
    input.placeholder = '닉네임 (한글·영어)'
    input.id = 'devsurvival-username-input'
    input.value = localStorage.getItem('devsurvival_username') || ''
    Object.assign(input.style, {
      position:     'absolute',
      zIndex:       '9999',
      display:      'none',
      fontSize:     '16px',
      fontFamily:   '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
      color:        '#ffffff',
      caretColor:   '#4488ff',
      background:   '#0a1432',
      border:       '2px solid #4488ff',
      borderRadius: '4px',
      padding:      '6px 10px',
      outline:      'none',
      boxShadow:    '0 0 10px rgba(68,136,255,0.6)',
      textAlign:    'center',
      width:        '200px',
      boxSizing:    'border-box',
    })
    // -webkit-text-fill-color: WebKit 계열 브라우저에서 color 대신 이 속성이 텍스트 색을 제어함
    input.style.setProperty('-webkit-text-fill-color', '#ffffff')

    // ── 확인 버튼 ──
    const btn = document.createElement('button')
    btn.textContent = '확인'
    btn.id = 'devsurvival-username-btn'
    Object.assign(btn.style, {
      position:     'absolute',
      zIndex:       '9999',
      display:      'none',
      fontSize:     '16px',
      fontFamily:   '"VT323", "Malgun Gothic", sans-serif',
      color:        '#aaddff',
      background:   '#0d2040',
      border:       '2px solid #3366cc',
      borderRadius: '4px',
      padding:      '4px 0',
      cursor:       'pointer',
      width:        '200px',
      boxSizing:    'border-box',
      outline:      'none',
    })

    const _confirm = () => {
      const val = input.value.trim().slice(0, 12)
      if (!val) { input.focus(); return }
      localStorage.setItem('devsurvival_username', val)
      if (this._usernameModalActive) {
        this._usernameModalActive = false
        this._hideUsernameInput()
        if (!this._renameMode) {
          Game.start()
        }
        this._renameMode = false
      }
    }
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') _confirm() })
    btn.addEventListener('click', _confirm)

    document.body.appendChild(input)
    document.body.appendChild(btn)
    this._usernameInput = input
    this._usernameBtn   = btn
  }

  _showUsernameInput() {
    const input = this._usernameInput
    const btn   = this._usernameBtn
    if (!input) return
    const canvas = document.getElementById('gameCanvas')
    if (!canvas) return
    const rect   = canvas.getBoundingClientRect()
    const scaleX = rect.width  / 800
    const scaleY = rect.height / 600

    const inputW = 200 * scaleX
    const inputH = 36 * scaleY
    const btnH   = 36 * scaleY
    const gap    = 8  * scaleY
    // 패널 중앙 x=400, 입력창 상단 y=302 (canvas 좌표)
    const screenCX   = rect.left + window.scrollX + 400 * scaleX
    const inputTop   = rect.top  + window.scrollY + 302 * scaleY

    // value는 처음 표시할 때만 초기화 (매 프레임 리셋 방지)
    if (input.style.display === 'none') {
      input.value = localStorage.getItem('devsurvival_username') || ''
    }

    const fs = Math.max(12, Math.round(15 * scaleY)) + 'px'
    input.style.left    = (screenCX - inputW / 2) + 'px'
    input.style.top     = inputTop + 'px'
    input.style.width   = inputW + 'px'
    input.style.height  = inputH + 'px'
    input.style.fontSize = fs
    input.style.display = 'block'

    if (btn) {
      btn.style.left    = (screenCX - inputW / 2) + 'px'
      btn.style.top     = (inputTop + inputH + gap) + 'px'
      btn.style.width   = inputW + 'px'
      btn.style.height  = btnH + 'px'
      btn.style.fontSize = fs
      btn.style.display = 'block'
    }
  }

  _hideUsernameInput() {
    if (this._usernameInput) this._usernameInput.style.display = 'none'
    if (this._usernameBtn)   this._usernameBtn.style.display   = 'none'
  }

  _select(key) {
    this._selected = key
    localStorage.setItem('devSurvivor_char', key)
    if (window.GameState) GameState.selectedCharacter = key
  }

  _bindClick() {
    window.addEventListener('click', (e) => {
      if (GameState.screen !== 'lobby') return
      // autoplay 차단 해제 후 BGM 재시도
      if (this._lobbyBgmPlaying) window.GameAudio?.resumeBGMIfNeeded?.()
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
          setTimeout(() => { if (this._usernameInput) this._usernameInput.focus() }, 80)
        }
        return
      }
      const u = this.upgradeBtnRect
      if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) {
        GameState.screen = 'upgrade'
        return
      }

      const r = this.renameBtnRect
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        this._renameMode = true
        this._usernameModalActive = true
        this._showUsernameInput()
        setTimeout(() => { if (this._usernameInput) this._usernameInput.focus() }, 80)
        return
      }
    })
  }

  render(ctx) {
    if (GameState.screen !== 'lobby') {
      this._hideUsernameInput()
      if (this._lobbyBgmPlaying) {
        this._lobbyBgmPlaying = false
        window.GameAudio?.stopBGM()
      }
      return
    }
    if (!this._lobbyBgmPlaying) {
      this._lobbyBgmPlaying = true
      window.GameAudio?.stopBGM()
      window.GameAudio?.startLobbyBGM()
    }

    GameState.selectedCharacter = this._selected

    // ── 1. 배경 ──────────────────────────────────────────────────────────
    if (_lobbyBgImg.complete && _lobbyBgImg.naturalWidth > 0) {
      ctx.drawImage(_lobbyBgImg, 0, 0, _lobbyBgImg.naturalWidth, _lobbyBgImg.naturalHeight, 0, 0, 800, 600)
      ctx.fillStyle = 'rgba(0,0,10,0.28)'
      ctx.fillRect(0, 0, 800, 600)
    } else {
      ctx.fillStyle = '#0d0d1a'
      ctx.fillRect(0, 0, 800, 600)
      ctx.strokeStyle = '#1a1a3e'; ctx.lineWidth = 1
      for (let x = 0; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke() }
      for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(800,y); ctx.stroke() }
    }

    // ── 2. 우측 다크 패널 오버레이 ────────────────────────────────────
    const rpGrad = ctx.createLinearGradient(488, 0, 800, 0)
    rpGrad.addColorStop(0,    'rgba(0,0,8,0)')
    rpGrad.addColorStop(0.1,  'rgba(0,0,12,0.78)')
    rpGrad.addColorStop(1,    'rgba(0,0,14,0.90)')
    ctx.fillStyle = rpGrad
    ctx.fillRect(488, 0, 312, 600)

    // CRT 모니터 데코 (monitor.png 312×255 — 우측 패널 너비와 정확히 일치)
    // 타이틀 텍스트(y=76, y=128)가 모니터 스크린 내부에 위치함
    if (window.drawUIMonitor) drawUIMonitor(ctx, 488, 0, 312, 255)

    // 하단 컨트롤 바
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, 572, 800, 28)

    // ── 3. 캐릭터 선택 헤더 ──────────────────────────────────────────
    ctx.fillStyle = 'rgba(70,95,130,0.8)'
    ctx.font = '13px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('─── 캐릭터 선택 ───', 251, 136)

    // ── 4. 캐릭터 카드 (좌측) ────────────────────────────────────────
    this._drawCharCards(ctx)

    // ── 5. 타이틀 (우측 패널) ────────────────────────────────────────
    const tx = 648   // 우측 패널 중앙
    ctx.textAlign = 'center'

    ctx.save()
    ctx.shadowColor = '#3366ff'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#5599ff'
    ctx.font = 'bold 70px "VT323", monospace'
    ctx.fillText('DEV', tx, 76)
    ctx.restore()

    ctx.fillStyle = '#ddeeff'
    ctx.font = 'bold 48px "VT323", monospace'
    ctx.fillText('SURVIVOR', tx, 128)

    // 타이틀 하단 구분선
    ctx.strokeStyle = 'rgba(80,110,190,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(514, 140); ctx.lineTo(792, 140); ctx.stroke()

    // 부제
    ctx.fillStyle = 'rgba(155,170,200,0.75)'
    ctx.font = '13px "VT323", monospace'
    ctx.fillText('AI가 발전하는 세상에서, 오늘도 버텨야 한다', tx, 158)

    // 통계
    const best = parseInt(localStorage.getItem('devsurvival_best') || '0')
    const pts  = window.MetaManager ? MetaManager.loadPoints() : 0
    ctx.fillStyle = '#FFD700'
    ctx.font = '13px "VT323", monospace'
    ctx.fillText(`최고 기록: ${best.toLocaleString()}점`, tx, 177)
    ctx.fillStyle = '#77bbff'
    ctx.fillText(`출시 포인트: ${pts}`, tx, 194)

    // ── 6. 버튼 스택 (Viking Survivors 스타일) ────────────────────────
    this._drawVikingBtn(ctx, this.startBtnRect,   '▷  시작하기  ◁', '#e8eeff', true)
    this._drawVikingBtn(ctx, this.upgradeBtnRect, '업그레이드',      '#aaccff', false)

    // ── 7. 닉네임 영역 ──────────────────────────────────────────────
    const uname = localStorage.getItem('devsurvival_username') || null
    if (uname) {
      ctx.fillStyle = '#5577aa'
      ctx.font = '13px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`👤  ${uname}`, tx, 384)
      this._drawVikingBtn(ctx, this.renameBtnRect, '닉네임 변경', '#6688aa', false)
    } else {
      ctx.fillStyle = '#3d5066'
      ctx.font = '12px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('시작하기를 누르면 닉네임을 입력합니다', tx, 384)
    }

    // ── 8. 조작 안내 (하단) ──────────────────────────────────────────
    ctx.fillStyle = '#4a5c6e'
    ctx.font = '14px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('이동: 방향키  /  스킬: Q/W/E/R  /  레벨업 시 스킬 선택', 400, 587)

    // ── 9. 닉네임 모달 ──────────────────────────────────────────────
    if (this._usernameModalActive) {
      ctx.fillStyle = 'rgba(0,0,0,0.72)'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#0a1432'; ctx.strokeStyle = '#3366cc'; ctx.lineWidth = 2
      ctx.fillRect(230, 220, 340, 200)
      ctx.strokeRect(230, 220, 340, 200)
      ctx.fillStyle = '#aaccff'
      ctx.font = 'bold 24px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(this._renameMode ? '닉네임 변경' : '닉네임을 입력하세요', 400, 256)
      ctx.fillStyle = '#556677'
      ctx.font = '14px "VT323", monospace'
      ctx.fillText('한글·영어 · 최대 12자', 400, 280)
      this._showUsernameInput()
    }

    ctx.textAlign = 'left'
  }

  _drawVikingBtn(ctx, r, label, textColor, isPrimary) {
    // 배경
    ctx.fillStyle = isPrimary ? 'rgba(18,22,38,0.94)' : 'rgba(12,14,24,0.88)'
    ctx.strokeStyle = isPrimary ? '#3d5588' : '#252a3c'
    ctx.lineWidth = isPrimary ? 1.5 : 1
    ctx.beginPath()
    ctx.roundRect(r.x, r.y, r.w, r.h, 4)
    ctx.fill()
    ctx.stroke()
    // 상단 미묘한 하이라이트 선
    if (isPrimary) {
      ctx.strokeStyle = 'rgba(100,140,220,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(r.x + 6, r.y + 1)
      ctx.lineTo(r.x + r.w - 6, r.y + 1)
      ctx.stroke()
    }
    // 텍스트
    ctx.fillStyle = textColor
    ctx.font = isPrimary ? 'bold 28px "VT323", monospace' : 'bold 20px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + (isPrimary ? 9 : 7))
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
        if (card.key === 'vampir') ctx.globalCompositeOperation = 'screen'
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
