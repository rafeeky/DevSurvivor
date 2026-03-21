class Lobby {
  constructor() {
    this.startBtnRect   = { x: 300, y: 330, w: 200, h: 50 }
    this.upgradeBtnRect = { x: 300, y: 392, w: 200, h: 44 }
    this._bindClick()
  }

  _bindClick() {
    window.addEventListener('click', (e) => {
      if (GameState.screen !== 'lobby') return
      const canvas = document.getElementById('gameCanvas')
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = 800 / rect.width
      const scaleY = 600 / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top)  * scaleY

      const s = this.startBtnRect
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
        Game.start()
        return
      }
      const u = this.upgradeBtnRect
      if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) {
        GameState.screen = 'upgrade'
      }
    })
  }

  render(ctx) {
    if (GameState.screen !== 'lobby') return

    // 배경
    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, 800, 600)
    ctx.strokeStyle = '#1a1a3e'
    ctx.lineWidth = 1
    for (let x = 0; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke() }
    for (let y = 0; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(800,y); ctx.stroke() }

    // 타이틀
    ctx.textAlign = 'center'
    ctx.fillStyle = '#4488ff'
    ctx.font = 'bold 56px monospace'
    ctx.fillText('DEV', 400, 160)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 56px monospace'
    ctx.fillText('SURVIVAL', 400, 220)

    // 부제
    ctx.fillStyle = '#7788aa'
    ctx.font = '16px monospace'
    ctx.fillText('AI가 발전하는 세상에서, 오늘도 버텨야 한다', 400, 258)

    // 최고 기록
    const best = parseInt(localStorage.getItem('devsurvival_best') || '0')
    ctx.fillStyle = '#FFD700'
    ctx.font = '14px monospace'
    ctx.fillText(`최고 기록: ${best.toLocaleString()}점`, 400, 290)

    // 출시 포인트
    const pts = window.MetaManager ? MetaManager.loadPoints() : 0
    ctx.fillStyle = '#88ffaa'
    ctx.font = '14px monospace'
    ctx.fillText(`보유 출시 포인트: ${pts}`, 400, 312)

    // 시작 버튼
    const s = this.startBtnRect
    ctx.fillStyle = '#1e3a6e'
    ctx.strokeStyle = '#4488ff'
    ctx.lineWidth = 2
    ctx.fillRect(s.x, s.y, s.w, s.h)
    ctx.strokeRect(s.x, s.y, s.w, s.h)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px monospace'
    ctx.fillText('[ 시작하기 ]', 400, 363)

    // 업그레이드 버튼
    const u = this.upgradeBtnRect
    ctx.fillStyle = '#0d1a0d'
    ctx.strokeStyle = '#44aa44'
    ctx.lineWidth = 2
    ctx.fillRect(u.x, u.y, u.w, u.h)
    ctx.strokeRect(u.x, u.y, u.w, u.h)
    ctx.fillStyle = '#88ff88'
    ctx.font = 'bold 16px monospace'
    ctx.fillText('[ 업그레이드 ]', 400, 420)

    // 조작 안내
    ctx.fillStyle = '#556677'
    ctx.font = '13px monospace'
    ctx.fillText('WASD 이동  /  Q~R 스킬 사용', 400, 470)
    ctx.fillText('레벨업 시 1·2·3 키 또는 클릭으로 선택', 400, 492)

    ctx.textAlign = 'left'
  }
}

window.Lobby = Lobby
const _lobby = new Lobby()
window._lobby = _lobby
