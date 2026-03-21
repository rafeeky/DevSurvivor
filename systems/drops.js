// ============================================================
// drops.js — Gold Drop System (T033)
// Mason (systems agent)
// ============================================================

// Gold item render size
const GOLD_ICON_SIZE = 44

// Preload gold images (explicit paths so asset validator can resolve them)
const _goldImgs = {}
;(function () {
  const paths = {
    1: 'assets/icon/gold_1.png',
    2: 'assets/icon/gold_2.png',
    3: 'assets/icon/gold_3.png',
    4: 'assets/icon/gold_4.png',
  }
  for (const [k, src] of Object.entries(paths)) {
    const img = new Image()
    img.src = src
    _goldImgs[k] = img
  }
})()

class DropManager {
  constructor() {
    this.items = [] // { x, y, type, life, maxLife, pickupRadius }
  }

  spawnDrop(x, y, type) {
    this.items.push({ x, y, type, life: 8, maxLife: 8, pickupRadius: 28, bobTime: 0 })
  }

  getDropTypeForEnemy(enemyClass) {
    const t = window.GameState?.gameTime || 0
    // AIBot (Mirror Bot boss) always drops gold_4
    if (enemyClass === 'AIBot') return 4
    // MirrorBot (전사봇) drops gold_3
    if (enemyClass === 'MirrorBot') return 3
    // Time-based for others
    if (t < 60) return 1
    return 2
  }

  update(deltaTime, player) {
    if (!player) return
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]
      item.life -= deltaTime
      if (item.life <= 0) {
        this.items.splice(i, 1)
        continue
      }

      item.bobTime = (item.bobTime || 0) + deltaTime

      // Pickup collision check
      const dx = player.x - item.x
      const dy = player.y - item.y
      if (Math.sqrt(dx * dx + dy * dy) < item.pickupRadius) {
        this._pickup(item, i)
      }
    }
  }

  _pickup(item, idx) {
    const type = item.type
    if (!window.GameState.goldInventory) {
      window.GameState.goldInventory = { 1: 0, 2: 0, 3: 0, 4: 0 }
    }
    window.GameState.goldInventory[type] = (window.GameState.goldInventory[type] || 0) + 1

    // gold_4 는 영구 저장 (뱀파이어 해금 재화)
    if (type === 4) {
      const stored = parseInt(localStorage.getItem('devSurvivor_gold4') || '0')
      localStorage.setItem('devSurvivor_gold4', stored + 1)
    }

    // Floating pickup text
    if (window.Game?.addFloatingText) {
      window.Game.addFloatingText(item.x, item.y - 20, `+gold_${type}`, '#FFD700', 1.2)
    }

    // Pickup event for unlock system
    window.GameState.lastPickedGold = type

    this.items.splice(idx, 1)
  }

  render(ctx) {
    for (const item of this.items) {
      const img = _goldImgs[item.type]
      // Fade out in last 2 seconds
      const alpha = item.life < 2 ? item.life / 2 : 1
      const bob = Math.sin((item.bobTime || 0) * Math.PI * 2.5) * 4  // ±4px, 2.5 Hz
      const drawY = item.y - GOLD_ICON_SIZE / 2 + bob
      ctx.save()
      ctx.globalAlpha = alpha
      if (img?.complete && img.naturalWidth > 0) {
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 8
        ctx.drawImage(img, item.x - GOLD_ICON_SIZE / 2, drawY, GOLD_ICON_SIZE, GOLD_ICON_SIZE)
        ctx.shadowBlur = 0
      } else {
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 8
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(item.x, item.y + bob, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      ctx.restore()
    }
  }

  reset() {
    this.items = []
  }
}

window.DropManager = DropManager
const _dropManager = new DropManager()
window.dropManager = _dropManager
