class Result {
  constructor() {
    this._winRestartRect  = { x: 78,  y: 478, w: 120, h: 44 }
    this._winMenuRect     = { x: 340, y: 478, w: 120, h: 44 }
    this._winUpgradeRect  = { x: 602, y: 478, w: 120, h: 44 }
    this._loseRestartRect = { x: 78,  y: 382, w: 120, h: 44 }
    this._loseMenuRect    = { x: 340, y: 382, w: 120, h: 44 }
    this._loseUpgradeRect = { x: 602, y: 382, w: 120, h: 44 }
    this._resultStartTime = null
    this._rateSaved = false
    this._bindClick()
  }

  _bindClick() {
    window.addEventListener('click', (e) => {
      if (GameState.screen !== 'result') return
      const canvas = document.getElementById('gameCanvas')
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (800 / rect.width)
      const y = (e.clientY - rect.top)  * (600 / rect.height)

      const elapsed = this._resultStartTime
        ? (performance.now() - this._resultStartTime) / 1000 : 0

      const win = GameState._lastWin
      if (win  && elapsed < 1.2) return  // 승리 연출 중 버튼 무효
      if (!win && elapsed < 1.2) return  // 패배 연출 중 버튼 무효

      const r = win ? this._winRestartRect  : this._loseRestartRect
      const m = win ? this._winMenuRect     : this._loseMenuRect
      const u = win ? this._winUpgradeRect  : this._loseUpgradeRect

      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        Game.restart(); return
      }
      if (x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h) {
        GameState.screen = 'lobby'; return
      }
      if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) {
        GameState.screen = 'upgrade'
      }
    })
  }

  render(ctx) {
    if (GameState.screen !== 'result') {
      this._resultStartTime = null
      this._rateSaved = false
      return
    }
    if (!this._resultStartTime) this._resultStartTime = performance.now()
    const elapsed = (performance.now() - this._resultStartTime) / 1000

    if (GameState._lastWin) this._renderWin(ctx, elapsed)
    else this._renderLose(ctx, elapsed)
  }

  // ── Dev Win ─────────────────────────────────────────────────────────────

  _renderWin(ctx, elapsed) {
    ctx.save()

    // 배경
    ctx.fillStyle = '#030d03'
    ctx.fillRect(0, 0, 800, 600)

    const glow = ctx.createRadialGradient(400, 300, 0, 400, 300, 380)
    glow.addColorStop(0, 'rgba(255,215,0,0.13)')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 800, 600)

    // ① 제목 페이드인 (0 ~ 0.6s)
    const titleAlpha = Math.min(1, elapsed / 0.6)
    ctx.save()
    ctx.globalAlpha = titleAlpha
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 56px monospace'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 24
    ctx.fillText('배포 성공!', 400, 94)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#88ff88'
    ctx.font = '14px "VT323", monospace'
    ctx.fillText('3분간의 사투 끝에 드디어 서버에 올라갔다.', 400, 124)
    ctx.restore()

    // ② 스탯 박스 페이드인 (0.4s ~ 0.9s)
    const statsAlpha = Math.min(1, Math.max(0, (elapsed - 0.4) / 0.5))
    ctx.save()
    ctx.globalAlpha = statsAlpha

    if (window.drawUIPanel) {
      drawUIPanel(ctx, 188, 148, 424, 240)
    } else {
      ctx.fillStyle = 'rgba(0,18,0,0.88)'
      ctx.fillRect(188, 148, 424, 240)
      ctx.strokeStyle = '#44aa44'
      ctx.lineWidth = 2
      ctx.strokeRect(188, 148, 424, 240)
    }

    const RANKS = ['인턴', '주니어 개발자', '시니어 개발자', '팀장', '디렉터', '본부장', '임원', '대표']
    const rankName = RANKS[Math.min(GameState.playerLevel - 1, RANKS.length - 1)]
    const t = GameState.gameTime
    const mins = Math.floor(t / 60)
    const secs = Math.floor(t % 60)
    const prevRate = parseInt(localStorage.getItem('devSurvivor_survivalRate') || '30')

    ctx.font = '13px "VT323", monospace'
    ctx.fillStyle = '#aaddcc'
    ctx.textAlign = 'left'
    const sx = 222
    const rows = [
      ['최종 직급',  rankName],
      ['생존 시간',  `${mins}:${secs.toString().padStart(2,'0')}`],
      ['처치 수',    `${GameState.killCount}마리`],
      ['출시 진행률',`${Math.floor(GameState.releaseProgress)}%`],
      ['최고 점수',  GameState.score.toLocaleString()],
      ['생존 확률',  `${prevRate}%`],
    ]
    rows.forEach(([label, val], i) => {
      const ry = 186 + i * 32
      ctx.fillStyle = '#aaddcc'
      ctx.textAlign = 'left'
      ctx.font = '13px "VT323", monospace'
      ctx.fillText(label, sx, ry)
      ctx.fillStyle = i === 5 ? '#88ddff' : '#ffffff'
      ctx.font = 'bold 13px "VT323", monospace'
      ctx.textAlign = 'right'
      ctx.fillText(val, 578, ry)
    })
    ctx.restore()

    // ③ 포인트 & 버튼 페이드인 (0.8s ~ 1.2s)
    const btnAlpha = Math.min(1, Math.max(0, (elapsed - 0.8) / 0.4))
    ctx.save()
    ctx.globalAlpha = btnAlpha

    const earned = GameState.lastEarnedPoints || 0
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 17px "VT323", monospace'
    ctx.fillText(`출시 포인트 +${earned} 🪙 획득!`, 400, 432)
    const total = window.MetaManager ? MetaManager.loadPoints() : 0
    ctx.fillStyle = '#88ffaa'
    ctx.font = '12px "VT323", monospace'
    ctx.fillText(`(누적: ${total}pt)`, 400, 454)

    const r = this._winRestartRect, m = this._winMenuRect, u = this._winUpgradeRect
    if (window.drawUIPanel) {
      drawUIPanel(ctx, r.x, r.y, r.w, r.h)
      drawUIPanel(ctx, m.x, m.y, m.w, m.h)
      drawUIPanel(ctx, u.x, u.y, u.w, u.h)
    } else {
      ctx.fillStyle = '#1e2a4a'; ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 2
      ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeRect(r.x, r.y, r.w, r.h)
      ctx.fillStyle = '#2a1a4a'; ctx.strokeStyle = '#8866cc'; ctx.lineWidth = 2
      ctx.fillRect(m.x, m.y, m.w, m.h); ctx.strokeRect(m.x, m.y, m.w, m.h)
      ctx.fillStyle = '#0d1a0d'; ctx.strokeStyle = '#44aa44'; ctx.lineWidth = 2
      ctx.fillRect(u.x, u.y, u.w, u.h); ctx.strokeRect(u.x, u.y, u.w, u.h)
    }
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px "VT323", monospace'
    ctx.fillText('[ 다시 도전 ]', r.x + r.w / 2, r.y + 28)
    ctx.fillStyle = '#ccaaff'
    ctx.fillText('[ 메뉴 ]', m.x + m.w / 2, m.y + 28)
    ctx.fillStyle = '#88ff88'
    ctx.fillText('[ 업그레이드 ]', u.x + u.w / 2, u.y + 28)
    ctx.restore()

    ctx.restore()
  }

  // ── AI Win (드라마틱 연출) ───────────────────────────────────────────────

  _renderLose(ctx, elapsed) {
    // 1. 암전 배경
    ctx.fillStyle = '#050508'
    ctx.fillRect(0, 0, 800, 600)

    // 2. 스포트라이트 콘
    const spotAlpha = Math.min(1, elapsed / 0.7)
    ctx.save()
    ctx.globalAlpha = spotAlpha
    ctx.beginPath()
    ctx.moveTo(400, 10)
    ctx.lineTo(90, 600)
    ctx.lineTo(710, 600)
    ctx.closePath()
    ctx.clip()
    const sg = ctx.createLinearGradient(400, 10, 400, 600)
    sg.addColorStop(0,   'rgba(255,240,160,0.0)')
    sg.addColorStop(0.2, 'rgba(255,230,140,0.38)')
    sg.addColorStop(1,   'rgba(255,210,100,0.72)')
    ctx.fillStyle = sg
    ctx.fillRect(0, 0, 800, 600)
    ctx.restore()

    // 3. "AI 승리" 대형 텍스트
    const titleAlpha = Math.min(1, Math.max(0, (elapsed - 0.15) / 0.55))
    ctx.save()
    ctx.globalAlpha = titleAlpha
    ctx.textAlign = 'center'
    ctx.font = 'bold 128px monospace'
    ctx.fillStyle = '#6b0000'
    ctx.fillText('AI', 400, 172)
    ctx.font = 'bold 82px monospace'
    ctx.fillStyle = '#b81010'
    ctx.fillText('승  리', 400, 266)
    ctx.restore()

    // 4. 쓰러진 캐릭터
    const charAlpha = Math.min(1, Math.max(0, (elapsed - 0.4) / 0.5))
    this._drawCollapsedPlayer(ctx, 400, 440, charAlpha)

    // 5. 결과 패널 (1.2초 이후 페이드인)
    const panelAlpha = Math.min(1, Math.max(0, (elapsed - 1.2) / 0.5))
    if (panelAlpha > 0) this._drawLosePanel(ctx, panelAlpha)
  }

  _drawCollapsedPlayer(ctx, cx, cy, alpha) {
    if (alpha <= 0) return
    ctx.save()
    ctx.globalAlpha = alpha

    // 선택된 캐릭터 스프라이트로 쓰러진 모습 표현
    const charKey = window.GameState?.selectedCharacter || 'adam'
    const cfg = window.CHAR_CONFIGS?.[charKey]
    const spr = window.CHAR_SPRITES?.[charKey]
    const anim = cfg?.hit || cfg?.idle
    const img  = spr?.hit || spr?.idle

    if (img?.complete && img.naturalWidth > 0 && anim) {
      const scale = (cfg.scale || 1) * 2.0  // 패배 화면에서 2배 크게
      const dw = cfg.renderW ? cfg.renderW * 2 : Math.round(anim.fw * scale)
      const dh = cfg.renderH ? cfg.renderH * 2 : Math.round(anim.fh * scale)
      ctx.imageSmoothingEnabled = false
      // 90도 회전해서 쓰러진 모습
      ctx.translate(cx, cy)
      ctx.rotate(Math.PI / 2)
      ctx.drawImage(img, 0, 0, anim.fw, anim.fh, -dw / 2, -dh / 2, dw, dh)
      ctx.rotate(-Math.PI / 2)
      ctx.translate(-cx, -cy)
    } else {
      // 폴백: 기존 캔버스 드로잉
      ctx.fillStyle = '#2255cc'
      ctx.fillRect(cx, cy - 5, 34, 10)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cx + 32, cy - 6, 10, 6)
      ctx.fillRect(cx + 32, cy + 3, 10, 6)
      ctx.fillStyle = '#4488ff'
      ctx.fillRect(cx - 24, cy - 9, 27, 18)
      ctx.fillRect(cx - 32, cy + 3, 12, 7)
      ctx.fillStyle = '#66aaff'
      ctx.beginPath()
      ctx.arc(cx - 30, cy - 2, 12, 0, Math.PI * 2)
      ctx.fill()
    }

    // 눈물 파티클
    ctx.fillStyle = '#88ccff'
    ctx.globalAlpha = alpha * 0.8
    ctx.beginPath(); ctx.arc(cx - 20, cy + 30, 4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cx - 8, cy + 36, 3, 0, Math.PI * 2); ctx.fill()
    // 느낌표
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#ffdd44'
    ctx.font = 'bold 18px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('!', cx + 30, cy - 20)
    ctx.fillText('!', cx + 46, cy - 36)

    ctx.restore()
  }

  _drawLosePanel(ctx, alpha) {
    const causes = [
      'BoxBot의 공격을 막지 못했습니다.',
      '야근 누적으로 체력이 바닥났습니다.',
      '스프린트 마감 압박을 버티지 못했습니다.',
      '버그보다 수정이 느렸습니다.',
      '기술 부채가 한꺼번에 터졌습니다.',
    ]
    const comments = [
      '"다음엔 더 잘할 수 있을 거야... 아마도."',
      '"야근 수당은 없습니다. 물론이죠."',
      '"AI는 쉬지 않는다. 당신도 쉬지 마."',
      '"포기하지 마세요. 다만 기대치를 낮추세요."',
      '"이 경험도 경력이 됩니다. 아마도."',
    ]
    const cause   = causes[GameState.killCount   % causes.length]
    const comment = comments[GameState.killCount % comments.length]

    const RANKS = ['인턴', '주니어 개발자', '시니어 개발자', '팀장', '디렉터', '본부장', '임원', '대표']
    const rankName = RANKS[Math.min(GameState.playerLevel - 1, RANKS.length - 1)]
    const t = GameState.gameTime
    const mins = Math.floor(t / 60)
    const secs = Math.floor(t % 60)
    const earned = GameState.lastEarnedPoints || 0

    const prevRate = parseInt(localStorage.getItem('devSurvivor_survivalRate') || '30')
    const gain = Math.max(1, Math.floor(t / 60))
    const newRate = Math.min(95, prevRate + gain)
    if (!this._rateSaved) {
      localStorage.setItem('devSurvivor_survivalRate', String(newRate))
      this._rateSaved = true
    }
    const total = window.MetaManager ? MetaManager.loadPoints() : 0

    ctx.save()
    ctx.globalAlpha = alpha

    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0,0,0,0.62)'
    ctx.fillRect(0, 0, 800, 600)

    // 카드 — 다크 테마
    const px = 104, py = 88, pw = 592, ph = 268
    ctx.fillStyle = '#08080f'
    ctx.fillRect(px, py, pw, ph)

    // 카드 내부 상단 미묘한 red tint
    const defeatGrad = ctx.createLinearGradient(px, py, px, py + ph)
    defeatGrad.addColorStop(0, 'rgba(160,10,20,0.18)')
    defeatGrad.addColorStop(0.5, 'rgba(60,5,10,0.08)')
    defeatGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = defeatGrad
    ctx.fillRect(px, py, pw, ph)

    // 카드 테두리
    ctx.strokeStyle = '#cc2233'
    ctx.lineWidth = 2
    ctx.strokeRect(px, py, pw, ph)

    // 헤더 배경
    ctx.fillStyle = '#220008'
    ctx.fillRect(px, py, pw, 40)

    // 헤더 텍스트 (red glow)
    ctx.save()
    ctx.shadowColor = '#ff2233'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#ff4455'
    ctx.font = 'bold 19px "VT323", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('프로젝트 취소 — AI 승리', 400, py + 26)
    ctx.restore()

    // 원인
    ctx.fillStyle = '#bb8899'
    ctx.font = '13px "VT323", monospace'
    ctx.fillText(cause, 400, py + 62)

    // 구분선 1
    ctx.strokeStyle = 'rgba(200,50,60,0.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(px+24, py+74); ctx.lineTo(px+pw-24, py+74); ctx.stroke()

    // 스탯 (2열)
    const statRows = [
      ['최종 직급', rankName],
      ['생존 시간', `${mins}:${secs.toString().padStart(2,'0')}`],
      ['처치 수',   `${GameState.killCount}마리`],
    ]
    const statRows2 = [
      ['출시 포인트', `+${earned} 🪙`],
      ['생존 확률', `${prevRate}% → ${newRate}%`],
    ]
    const c1l = px + 28, c1r = px + 278
    const c2l = px + 318, c2r = px + pw - 20
    statRows.forEach(([lbl, val], i) => {
      const ry = py + 100 + i * 26
      ctx.fillStyle = '#7799aa'; ctx.font = '12px "VT323", monospace'; ctx.textAlign = 'left'
      ctx.fillText(lbl, c1l, ry)
      ctx.fillStyle = '#ddeeff'; ctx.font = 'bold 12px "VT323", monospace'; ctx.textAlign = 'right'
      ctx.fillText(val, c1r, ry)
    })
    statRows2.forEach(([lbl, val], i) => {
      const ry = py + 100 + i * 26
      ctx.fillStyle = '#7799aa'; ctx.font = '12px "VT323", monospace'; ctx.textAlign = 'left'
      ctx.fillText(lbl, c2l, ry)
      ctx.fillStyle = i === 1 ? '#ff8888' : '#ddeeff'
      ctx.font = 'bold 12px "VT323", monospace'; ctx.textAlign = 'right'
      ctx.fillText(val, c2r, ry)
    })

    // 구분선 2
    ctx.strokeStyle = 'rgba(200,50,60,0.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(px+24, py+178); ctx.lineTo(px+pw-24, py+178); ctx.stroke()

    // 포인트 요약
    ctx.fillStyle = '#aabbcc'; ctx.font = '12px "VT323", monospace'; ctx.textAlign = 'center'
    ctx.fillText(`출시 포인트 +${earned} 획득  (누적: ${total}pt)`, 400, py + 200)

    // 블랙코미디 멘트
    ctx.fillStyle = '#667788'; ctx.font = '11px "VT323", monospace'
    ctx.fillText(comment, 400, py + 222)

    // 구분선 3
    ctx.strokeStyle = 'rgba(200,50,60,0.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(px+24, py+234); ctx.lineTo(px+pw-24, py+234); ctx.stroke()

    // 버튼
    const r = this._loseRestartRect, m = this._loseMenuRect, u = this._loseUpgradeRect
    if (window.drawUIPanel) {
      drawUIPanel(ctx, r.x, r.y, r.w, r.h)
      drawUIPanel(ctx, m.x, m.y, m.w, m.h)
      drawUIPanel(ctx, u.x, u.y, u.w, u.h)
    } else {
      ctx.fillStyle = '#1e3a88'; ctx.strokeStyle = '#4466cc'; ctx.lineWidth = 2
      ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeRect(r.x, r.y, r.w, r.h)
      ctx.fillStyle = '#2a1a4a'; ctx.strokeStyle = '#8866cc'; ctx.lineWidth = 2
      ctx.fillRect(m.x, m.y, m.w, m.h); ctx.strokeRect(m.x, m.y, m.w, m.h)
      ctx.fillStyle = '#1a4a1a'; ctx.strokeStyle = '#2d8840'; ctx.lineWidth = 2
      ctx.fillRect(u.x, u.y, u.w, u.h); ctx.strokeRect(u.x, u.y, u.w, u.h)
    }
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px "VT323", monospace'; ctx.textAlign = 'center'
    ctx.fillText('[ 재도전 ]', r.x + r.w / 2, r.y + 28)
    ctx.fillStyle = '#ccaaff'
    ctx.fillText('[ 메뉴 ]', m.x + m.w / 2, m.y + 28)
    ctx.fillStyle = '#88ff88'
    ctx.fillText('[ 업그레이드 ]', u.x + u.w / 2, u.y + 28)

    ctx.restore()
  }
}

window.Result = Result
const _result = new Result()
window._result = _result
