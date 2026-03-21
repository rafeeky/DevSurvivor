class Result {
  constructor() {
    this.restartBtnRect = { x: 210, y: 480, w: 160, h: 46 }
    this.upgradeBtnRect = { x: 430, y: 480, w: 160, h: 46 }
    this._bindClick()
  }

  _bindClick() {
    window.addEventListener('click', (e) => {
      if (GameState.screen !== 'result') return
      const canvas = document.getElementById('gameCanvas')
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = 800 / rect.width
      const scaleY = 600 / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top)  * scaleY

      const r = this.restartBtnRect
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        Game.restart()
        return
      }
      const u = this.upgradeBtnRect
      if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) {
        GameState.screen = 'upgrade'
      }
    })
  }

  render(ctx) {
    if (GameState.screen !== 'result') return

    const win = GameState._lastWin

    // 배경
    ctx.fillStyle = win ? '#0a1a0a' : '#0d0d0d'
    ctx.fillRect(0, 0, 800, 600)

    // 테두리
    ctx.strokeStyle = win ? '#33cc66' : '#cc3333'
    ctx.lineWidth = 4
    ctx.strokeRect(4, 4, 792, 592)

    // 타이틀
    ctx.textAlign = 'center'
    ctx.font = 'bold 64px monospace'
    ctx.fillStyle = win ? '#66ff88' : '#ff6666'
    ctx.fillText(win ? 'Dev Win!' : 'AI Win!', 400, 120)

    // 부제
    ctx.font = '17px monospace'
    ctx.fillStyle = '#888'
    ctx.fillText(win ? '오늘은 내가 버텼다.' : 'AI가 더 잘했다.', 400, 150)

    // 통계 박스
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(200, 170, 400, 200)
    ctx.strokeStyle = '#334'
    ctx.lineWidth = 1
    ctx.strokeRect(200, 170, 400, 200)

    const t    = GameState.gameTime
    const mins = Math.floor(t / 60)
    const secs = Math.floor(t % 60)

    ctx.fillStyle = '#ccddff'
    ctx.font = '15px monospace'
    ctx.textAlign = 'left'
    const statsX = 230
    ctx.fillText('최종 점수',   statsX, 200)
    ctx.fillText('생존 시간',   statsX, 226)
    ctx.fillText('처치 수',     statsX, 252)
    ctx.fillText('출시 진행률', statsX, 278)
    ctx.fillText('도달 레벨',   statsX, 304)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffffff'
    const statsRX = 570
    ctx.fillText(GameState.score.toLocaleString(),          statsRX, 200)
    ctx.fillText(`${mins}:${secs.toString().padStart(2,'0')}`, statsRX, 226)
    ctx.fillText(`${GameState.killCount}마리`,              statsRX, 252)
    ctx.fillText(`${Math.floor(GameState.releaseProgress)}%`, statsRX, 278)
    ctx.fillText(`Lv.${GameState.playerLevel}`,             statsRX, 304)

    // 획득 출시 포인트
    const earned = GameState.lastEarnedPoints || 0
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 18px monospace'
    ctx.fillText(`출시 포인트 +${earned} 획득!`, 400, 400)
    const total = window.MetaManager ? MetaManager.loadPoints() : 0
    ctx.fillStyle = '#88ffaa'
    ctx.font = '13px monospace'
    ctx.fillText(`(누적: ${total}pt)`, 400, 420)

    // 다시 하기 버튼
    const r = this.restartBtnRect
    ctx.fillStyle = '#1e2a4a'
    ctx.strokeStyle = '#4488ff'
    ctx.lineWidth = 2
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.strokeRect(r.x, r.y, r.w, r.h)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 15px monospace'
    ctx.fillText('[ 다시 하기 ]', r.x + r.w / 2, r.y + 29)

    // 업그레이드 버튼
    const u = this.upgradeBtnRect
    ctx.fillStyle = '#0d1a0d'
    ctx.strokeStyle = '#44aa44'
    ctx.lineWidth = 2
    ctx.fillRect(u.x, u.y, u.w, u.h)
    ctx.strokeRect(u.x, u.y, u.w, u.h)
    ctx.fillStyle = '#88ff88'
    ctx.font = 'bold 15px monospace'
    ctx.fillText('[ 업그레이드 ]', u.x + u.w / 2, u.y + 29)

    ctx.textAlign = 'left'
  }
}

window.Result = Result
const _result = new Result()
window._result = _result
