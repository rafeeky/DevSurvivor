/**
 * ui/uiassets.js — UI 에셋 로더 & 공통 드로우 헬퍼
 *
 * 채택 에셋 (assets/ui/):
 *   panel.png       252×155  — 다크 패널 프레임 (9-slice)
 *   monitor.png     312×255  — CRT 모니터 데코 (그대로 사용)
 *   arrows.png      128×96   — 방향키 버튼 (32×32 × 4col × 3row)
 *   loadingbar.png  8×12     — HP바 배경 세그먼트 (타일링)
 *   bulb.png        32×8     — 상태 인디케이터 도트 (8×8 × 4col)
 *   granteddenied.png 7200×145 — ACCESS 애니메이션 스트립
 */

;(function () {
  const _srcs = {
    panel:        'assets/ui/panel.png',
    monitor:      'assets/ui/monitor.png',
    arrows:       'assets/ui/arrows.png',
    loadingbar:   'assets/ui/loadingbar.png',
    bulb:         'assets/ui/bulb.png',
    granteddenied:'assets/ui/granteddenied.png',
    winloose:     'assets/ui/PNG/Win_loose.png',
    mainmenu:     'assets/ui/PNG/Main_menu.png',
    buttons:      'assets/ui/PNG/Buttons.png',
  }

  const _imgs = {}
  for (const [key, src] of Object.entries(_srcs)) {
    const img = new Image()
    img.src = src
    _imgs[key] = img
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIPanel(ctx, x, y, w, h)
  //   panel.png (252×155) 9-slice 패널 렌더
  //   corner = 14px — 픽셀아트 모서리 크기
  // ─────────────────────────────────────────────────────────────
  const _PW = 252, _PH = 155, _PC = 14   // panel natural size & corner

  window.drawUIPanel = function (ctx, x, y, w, h) {
    const img = _imgs.panel
    if (!img?.complete || img.naturalWidth === 0) {
      // 이미지 미로드 시 폴백
      ctx.fillStyle = 'rgba(5,5,20,0.9)'
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = '#443366'
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, w, h)
      return
    }

    const c  = _PC
    const mw = _PW - 2 * c   // source middle width
    const mh = _PH - 2 * c   // source middle height
    const dw = w - 2 * c     // dest middle width
    const dh = h - 2 * c     // dest middle height

    ctx.imageSmoothingEnabled = false

    // 모서리 4개
    ctx.drawImage(img,      0,       0, c,  c,  x,         y,         c, c)
    ctx.drawImage(img, _PW - c,      0, c,  c,  x + w - c, y,         c, c)
    ctx.drawImage(img,      0, _PH - c, c,  c,  x,         y + h - c, c, c)
    ctx.drawImage(img, _PW - c, _PH - c, c, c,  x + w - c, y + h - c, c, c)

    // 상/하 엣지
    if (dw > 0) {
      ctx.drawImage(img,      c,       0, mw, c,  x + c, y,         dw, c)
      ctx.drawImage(img,      c, _PH - c, mw, c,  x + c, y + h - c, dw, c)
    }
    // 좌/우 엣지
    if (dh > 0) {
      ctx.drawImage(img,      0,       c, c,  mh, x,         y + c, c, dh)
      ctx.drawImage(img, _PW - c,      c, c,  mh, x + w - c, y + c, c, dh)
    }
    // 중앙
    if (dw > 0 && dh > 0) {
      ctx.drawImage(img, c, c, mw, mh, x + c, y + c, dw, dh)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIArrow(ctx, dir, style, x, y, size)
  //   arrows.png: 4col × 3row, 각 32×32
  //   dir:   'right'|'down'|'left'|'up'
  //   style: 'teal'|'green'|'purple'
  // ─────────────────────────────────────────────────────────────
  const _ARROW_COL = { right: 0, down: 1, left: 2, up: 3 }
  const _ARROW_ROW = { teal: 0, green: 1, purple: 2 }

  window.drawUIArrow = function (ctx, dir, style, x, y, size) {
    const img = _imgs.arrows
    if (!img?.complete || img.naturalWidth === 0) return
    const col = _ARROW_COL[dir]  ?? 0
    const row = _ARROW_ROW[style] ?? 2
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, col * 32, row * 32, 32, 32, x, y, size, size)
  }

  // ─────────────────────────────────────────────────────────────
  // drawUILoadingBar(ctx, x, y, w, h)
  //   loadingbar.png (8×12) 을 타일링해 HP바 배경으로 사용
  // ─────────────────────────────────────────────────────────────
  window.drawUILoadingBar = function (ctx, x, y, w, h) {
    const img = _imgs.loadingbar
    if (!img?.complete || img.naturalWidth === 0) return
    ctx.imageSmoothingEnabled = false
    const segW = 8
    for (let ox = 0; ox < w; ox += segW) {
      const sw = Math.min(segW, w - ox)
      ctx.drawImage(img, 0, 0, sw, 12, x + ox, y, sw, h)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIMonitor(ctx, x, y, w, h)
  //   monitor.png (312×255) CRT 모니터 데코
  // ─────────────────────────────────────────────────────────────
  window.drawUIMonitor = function (ctx, x, y, w, h) {
    const img = _imgs.monitor
    if (!img?.complete || img.naturalWidth === 0) return
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, 312, 255, x, y, w, h)
    ctx.imageSmoothingEnabled = false
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIBulb(ctx, index, x, y, size)
  //   bulb.png (32×8): 8×8 × 4개 도트
  //   index: 0~3
  // ─────────────────────────────────────────────────────────────
  window.drawUIBulb = function (ctx, index, x, y, size) {
    const img = _imgs.bulb
    if (!img?.complete || img.naturalWidth === 0) return
    const i = Math.max(0, Math.min(3, index))
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, i * 8, 0, 8, 8, x, y, size, size)
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIMainMenuBtn(ctx, btnIdx, x, y, w, h, label, textColor, isPrimary)
  //   Main_menu.png (496×176) col1 버튼 스프라이트
  //   btnIdx: 0=RESUME, 1=RESTART, 2=SETTINGS, 3=LEVELS…  (y=34+idx*16, h=11)
  //   버튼 스프라이트 → 배경으로 스케일, label 텍스트 위에 그림
  // ─────────────────────────────────────────────────────────────
  const _MM_BTN_X = 96, _MM_BTN_W = 80, _MM_BTN_H = 11, _MM_BTN_Y0 = 34, _MM_STEP = 16

  window.drawUIMainMenuBtn = function (ctx, btnIdx, x, y, w, h, label, textColor, isPrimary) {
    const img = _imgs.mainmenu
    const srcY = _MM_BTN_Y0 + (btnIdx || 0) * _MM_STEP

    ctx.save()
    ctx.imageSmoothingEnabled = false
    if (img?.complete && img.naturalWidth > 0) {
      // 버튼 스프라이트를 반투명 배경으로 사용
      ctx.globalAlpha = 0.72
      ctx.drawImage(img, _MM_BTN_X, srcY, _MM_BTN_W, _MM_BTN_H, x, y, w, h)
      ctx.globalAlpha = 1
    } else {
      // 폴백
      ctx.fillStyle = isPrimary ? 'rgba(18,22,38,0.94)' : 'rgba(12,14,24,0.88)'
      ctx.strokeStyle = isPrimary ? '#3d5588' : '#252a3c'
      ctx.lineWidth = isPrimary ? 1.5 : 1
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill(); ctx.stroke()
    }
    // 텍스트 오버레이
    if (label) {
      ctx.shadowColor = isPrimary ? 'rgba(100,160,255,0.6)' : 'transparent'
      ctx.shadowBlur  = isPrimary ? 6 : 0
      ctx.fillStyle   = textColor || (isPrimary ? '#e8eeff' : '#aaccff')
      ctx.font        = isPrimary ? 'bold 28px "VT323", monospace' : 'bold 20px "VT323", monospace'
      ctx.textAlign   = 'center'
      ctx.fillText(label, x + w / 2, y + h / 2 + (isPrimary ? 9 : 7))
    }
    ctx.restore()
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIButtonFrame(ctx, x, y, w, h, label, textColor)
  //   Buttons.png (400×528) 와이드 버튼 프레임
  //   y=363-381 (h=18) 행 — 투명 내부, 테두리만 있는 프레임
  //   배경은 caller가 미리 그림 (fillRect 등)
  // ─────────────────────────────────────────────────────────────
  const _BF_SY = 363, _BF_SH = 19, _BF_SW = 399

  window.drawUIButtonFrame = function (ctx, x, y, w, h, label, textColor) {
    const img = _imgs.buttons
    ctx.save()
    ctx.imageSmoothingEnabled = false
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, _BF_SY, _BF_SW, _BF_SH, x, y, w, h)
    }
    if (label) {
      ctx.fillStyle = textColor || '#ffffff'
      ctx.font = 'bold 18px "VT323", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, x + w / 2, y + h / 2 + 6)
    }
    ctx.restore()
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIMainMenuPanel(ctx, x, y, w, h)
  //   Main_menu.png (496×176) col0 (x=0-79) 전체 패널 배경
  //   버튼 목록이 포함된 나무/픽셀 아트 메뉴 패널
  // ─────────────────────────────────────────────────────────────
  window.drawUIMainMenuPanel = function (ctx, x, y, w, h) {
    const img = _imgs.mainmenu
    if (!img?.complete || img.naturalWidth === 0) return
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.globalAlpha = 0.55
    ctx.drawImage(img, 0, 0, 80, 176, x, y, w, h)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIRating(ctx, count, x, y, w, h)
  //   Win_loose.png (448×416) 하단 별 클러스터 스트립 (y≈374)
  //   count: 1~3 = 금별 ★ 개수, 0 = 빈 별 (X 상태)
  //   별 클러스터 (★★★ / ★★☆ / ★☆☆) 순서로 배치
  // ─────────────────────────────────────────────────────────────
  const _WL_SY = 374, _WL_SH = 42, _WL_SW = 80

  window.drawUIRating = function (ctx, count, x, y, w, h) {
    const img = _imgs.winloose
    // 폴백: 캔버스 별 드로잉
    const _fallback = () => {
      ctx.font = `${Math.round(h * 0.85)}px "VT323", monospace`
      ctx.textAlign = 'center'
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < count ? '#FFD700' : '#2a2a44'
        ctx.fillText('★', x + w / 6 + i * (w / 3), y + h * 0.82)
      }
      ctx.textAlign = 'left'
    }
    if (!img?.complete || img.naturalWidth === 0) { _fallback(); return }

    // Win_loose.png 하단 스트립: x=0 → 3-star, x=80 → 2-star, x=160 → 1-star, x=240 → 0-star
    const clampedCount = Math.max(0, Math.min(3, count))
    const srcX = (3 - clampedCount) * _WL_SW
    ctx.imageSmoothingEnabled = false
    // 성공적으로 그렸는지 체크 — 단순히 그리고 폴백은 숨김
    ctx.drawImage(img, srcX, _WL_SY, _WL_SW, _WL_SH, x, y, w, h)
  }

  // ─────────────────────────────────────────────────────────────
  // drawUIGranted(ctx, isWin, elapsed, x, y, w, h)
  //   granteddenied.png (7200×145) ACCESS 애니메이션 스트립
  //   isWin=true  → 좌측 절반 (0~3600) ACCESS GRANTED
  //   isWin=false → 우측 절반 (3600~7200) ACCESS DENIED
  //   elapsed: 재생 경과 시간(초) — 0부터 시작
  //   24프레임 × 150px/프레임, 12fps 재생
  // ─────────────────────────────────────────────────────────────
  const _GD_HALF   = 3600
  const _GD_FW     = 150   // 프레임 너비
  const _GD_FRAMES = 24
  const _GD_FPS    = 12

  window.drawUIGranted = function (ctx, isWin, elapsed, x, y, w, h) {
    const img = _imgs.granteddenied
    if (!img?.complete || img.naturalWidth === 0) return
    const frame = Math.min(Math.floor(elapsed * _GD_FPS), _GD_FRAMES - 1)
    const srcX  = (isWin ? 0 : _GD_HALF) + frame * _GD_FW
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, srcX, 0, _GD_FW, 145, x, y, w, h)
  }

  // 외부 참조용 이미지 맵 노출
  window._UIImgs = _imgs

  // ─────────────────────────────────────────────────────────────
  // drawCyberpunkBtn(ctx, x, y, w, h, label, style)
  //   사이버펑크 픽셀 아트 버튼 — 순수 캔버스
  //   style: 'primary'(초록) | 'blue'(파랑) | 'danger'(빨강) | 'dim'(회색)
  // ─────────────────────────────────────────────────────────────
  const _CP_BTN = {
    primary: { fill: '#1a7a38', hi:  '#22aa4e', lo: '#0f4a22', text: '#ffffff', shadow: 'rgba(34,180,80,0.45)' },
    blue:    { fill: '#1a3a7a', hi:  '#2255bb', lo: '#0f244a', text: '#cce0ff', shadow: 'rgba(50,120,220,0.35)' },
    danger:  { fill: '#7a1a1a', hi:  '#bb2222', lo: '#4a0f0f', text: '#ffffff', shadow: 'rgba(200,40,40,0.45)' },
    dim:     { fill: '#1e2740', hi:  '#2d3d60', lo: '#141c30', text: '#778899', shadow: 'transparent' },
  }

  window.drawCyberpunkBtn = function (ctx, x, y, w, h, label, style = 'blue') {
    const c = _CP_BTN[style] || _CP_BTN.blue
    ctx.save()
    ctx.imageSmoothingEnabled = false

    // 배경 fill
    ctx.fillStyle = c.fill
    ctx.fillRect(x, y, w, h)

    // 하이라이트 (상단 1px, 좌측 1px)
    ctx.fillStyle = c.hi
    ctx.fillRect(x, y, w, 2)
    ctx.fillRect(x, y, 2, h)

    // 쉐도우 (하단 2px, 우측 2px)
    ctx.fillStyle = c.lo
    ctx.fillRect(x, y + h - 2, w, 2)
    ctx.fillRect(x + w - 2, y, 2, h)

    // 코너 노치 (픽셀 아트 특유의 깎인 모서리)
    const nc = 4
    ctx.fillStyle = '#080e1e'
    ctx.fillRect(x, y, nc, nc)               // TL
    ctx.fillRect(x + w - nc, y, nc, nc)       // TR
    ctx.fillRect(x, y + h - nc, nc, nc)       // BL
    ctx.fillRect(x + w - nc, y + h - nc, nc, nc) // BR

    // 텍스트
    if (label) {
      if (c.shadow !== 'transparent') {
        ctx.shadowColor = c.shadow
        ctx.shadowBlur  = 8
      }
      ctx.fillStyle  = c.text
      ctx.font       = `bold ${Math.round(h * 0.5)}px "VT323", monospace`
      ctx.textAlign  = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x + w / 2, y + h / 2 + 1)
      ctx.shadowBlur = 0
      ctx.textBaseline = 'alphabetic'
    }
    ctx.restore()
  }

  // ─────────────────────────────────────────────────────────────
  // drawCyberpunkPanel(ctx, x, y, w, h, title)
  //   사이버펑크 패널 — 이중 테두리 + 코너 마크 + 선택적 타이틀 헤더
  // ─────────────────────────────────────────────────────────────
  window.drawCyberpunkPanel = function (ctx, x, y, w, h, title) {
    ctx.save()
    ctx.imageSmoothingEnabled = false

    // 패널 배경
    ctx.fillStyle = '#0e1628'
    ctx.fillRect(x, y, w, h)

    // 외곽 테두리
    ctx.strokeStyle = '#2a3d66'
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)

    // 내곽 테두리 (2px 안쪽)
    ctx.strokeStyle = '#1a2844'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8)

    // 코너 마크 (L자형)
    const ml = 10
    ctx.strokeStyle = '#4466aa'
    ctx.lineWidth = 2
    const corners = [[x+2,y+2],[x+w-2,y+2],[x+2,y+h-2],[x+w-2,y+h-2]]
    const dirs     = [[1,1],   [-1,1],    [1,-1],    [-1,-1]]
    for (let i = 0; i < 4; i++) {
      const [cx2, cy2] = corners[i]
      const [dx, dy]   = dirs[i]
      ctx.beginPath()
      ctx.moveTo(cx2 + dx * ml, cy2)
      ctx.lineTo(cx2, cy2)
      ctx.lineTo(cx2, cy2 + dy * ml)
      ctx.stroke()
    }

    // 타이틀 헤더 스트립
    if (title) {
      const th = 24
      ctx.fillStyle = '#162040'
      ctx.fillRect(x + 5, y + 5, w - 10, th)
      ctx.strokeStyle = '#2a3d66'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 5, y + 5, w - 10, th)
      ctx.fillStyle  = '#ffffff'
      ctx.font       = 'bold 16px "VT323", monospace'
      ctx.textAlign  = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(title.toUpperCase(), x + w / 2, y + 5 + th / 2)
      ctx.textBaseline = 'alphabetic'
    }

    ctx.restore()
  }
})()
