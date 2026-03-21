// 스킬 이름 → 아이콘 파일 매핑
const _SKILL_ICON_MAP = {
  '긴급 수정':    'assets/custom/icons/skill_emergency_fix.png',
  '디버그':       'assets/custom/icons/skill_debug.png',
  '우선순위정리': 'assets/custom/icons/skill_priority_sort.png',
  '커피 한 잔':   'assets/custom/icons/skill_coffee.png',
  '피규어청소':   'assets/custom/icons/skill_figure_clean.png',
  '강아지쓰다듬기': 'assets/custom/icons/skill_pet_dog.png',
  '낮잠자기':     'assets/custom/icons/skill_nap.png',
  '자동 저장':    'assets/custom/icons/skill_autosave.png',
}
// 지연 로드 캐시
const _skillIconCache = {}
function _getSkillIcon(name) {
  const src = _SKILL_ICON_MAP[name]
  if (!src) return null
  if (!_skillIconCache[name]) {
    const img = new Image()
    img.src = src
    _skillIconCache[name] = img
  }
  return _skillIconCache[name]
}
// 전역 노출 — levelup.js 등 다른 모듈에서 사용
window.getSkillIcon = _getSkillIcon

class HUD {
  render(ctx, gameTime) {
    if (GameState.screen !== 'playing' && GameState.screen !== 'paused') return
    const player = Game.player
    if (!player) return
    this._drawTopBar(ctx, player, gameTime)
    this._drawBottomBar(ctx)
    this._drawDangerOverlay(ctx, gameTime)
  }

  _drawTopBar(ctx, player, gameTime) {
    // 상단 반투명 바 배경
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, 800, 48)

    // HP 바
    ctx.fillStyle = '#333'
    ctx.fillRect(12, 12, 180, 16)
    const hpRatio = player.hp / player.maxHp
    ctx.fillStyle = hpRatio < 0.3 ? '#ff3333' : hpRatio < 0.6 ? '#ffaa00' : '#33cc66'
    ctx.fillRect(12, 12, 180 * hpRatio, 16)
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 1
    ctx.strokeRect(12, 12, 180, 16)
    ctx.fillStyle = '#fff'
    ctx.font = '12px monospace'
    ctx.fillText(`HP ${Math.ceil(player.hp)}/${player.maxHp}`, 14, 24)

    // 보호막 아이콘
    if (player.shields > 0) {
      ctx.fillStyle = '#44aaff'
      ctx.font = '12px monospace'
      ctx.fillText(`🛡 ${player.shields}`, 200, 24)
    }

    // 타이머 (남은 시간)
    const remaining = Math.max(0, 180 - gameTime)
    const mins = Math.floor(remaining / 60)
    const secs = Math.floor(remaining % 60)
    const timeStr = `${mins}:${secs.toString().padStart(2,'0')}`
    ctx.fillStyle = remaining <= 30 ? '#ff4444' : '#ffffff'
    ctx.font = 'bold 22px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(timeStr, 400, 30)
    ctx.textAlign = 'left'

    // 출시 진행률
    ctx.fillStyle = '#333'
    ctx.fillRect(520, 12, 140, 10)
    ctx.fillStyle = '#44ffaa'
    ctx.fillRect(520, 12, 140 * (GameState.releaseProgress / 100), 10)
    ctx.fillStyle = '#aaa'
    ctx.font = '11px monospace'
    ctx.fillText(`출시 ${Math.floor(GameState.releaseProgress)}%`, 522, 34)

    // 점수
    ctx.fillStyle = '#FFD700'
    ctx.font = '13px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${GameState.score.toLocaleString()}`, 788, 24)
    ctx.textAlign = 'left'
  }

  _drawBottomBar(ctx) {
    // 하단 반투명 바 배경
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 548, 800, 52)

    // 스킬 슬롯 4개 (Q/W/E/R)
    const keys = ['Q','W','E','R']
    for (let i = 0; i < 4; i++) {
      const sx = 12 + i * 112
      const sy = 553
      const state = Game.skillManager?.getSkillState(i) || { isEmpty: true }

      if (state.isEmpty) {
        ctx.fillStyle = '#1a1a2e'
        ctx.strokeStyle = '#333'
      } else if (state.cooldownRemaining > 0) {
        ctx.fillStyle = '#111'
        ctx.strokeStyle = '#444'
      } else {
        ctx.fillStyle = '#1e2a4a'
        ctx.strokeStyle = '#4488ff'
      }
      ctx.lineWidth = 1.5
      ctx.fillRect(sx, sy, 100, 40)
      ctx.strokeRect(sx, sy, 100, 40)

      // 키 레이블
      ctx.fillStyle = '#888'
      ctx.font = '10px monospace'
      ctx.fillText(keys[i], sx + 4, sy + 13)

      if (!state.isEmpty) {
        // 스킬 아이콘 (있으면)
        const icon = _getSkillIcon(state.name)
        if (icon?.complete && icon.naturalWidth > 0) {
          ctx.save()
          ctx.globalAlpha = state.cooldownRemaining > 0 ? 0.35 : 0.85
          ctx.imageSmoothingEnabled = true
          ctx.drawImage(icon, 0, 0, icon.naturalWidth, icon.naturalHeight, sx + 2, sy + 4, 32, 32)
          ctx.globalAlpha = 1
          ctx.imageSmoothingEnabled = false
          ctx.restore()
        }

        // 스킬 이름
        ctx.fillStyle = state.cooldownRemaining > 0 ? '#556' : '#aaccff'
        ctx.font = '11px monospace'
        ctx.fillText(state.name.substring(0, 7), sx + 38, sy + 17)

        // 쿨다운 숫자
        if (state.cooldownRemaining > 0) {
          ctx.fillStyle = '#ff8844'
          ctx.font = 'bold 13px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(state.cooldownRemaining.toFixed(1), sx + 68, sy + 36)
          ctx.textAlign = 'left'

          // 쿨다운 진행 바
          ctx.fillStyle = '#224'
          ctx.fillRect(sx, sy + 38, 100, 3)
          const ratio = 1 - state.cooldownRemaining / state.cooldownMax
          ctx.fillStyle = '#4488ff'
          ctx.fillRect(sx, sy + 38, 100 * ratio, 3)
        } else {
          ctx.fillStyle = '#44ff88'
          ctx.font = '10px monospace'
          ctx.fillText('READY', sx + 52, sy + 36)
        }
      }
    }

    // 빈 슬롯 힌트 (초반 안내)
    const allEmpty = !Game.skillManager?.slots?.some(Boolean)
    if (allEmpty) {
      ctx.fillStyle = '#556688'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('적을 처치해 경험치를 모으면 레벨업 시 스킬을 획득합니다', 250, 571)
      ctx.textAlign = 'left'
    }

    // 레벨 & 경험치 바
    const RANKS = ['인턴', '주니어 개발자', '개발자', '주임 개발자', '시니어 개발자']
    const rankName = RANKS[Math.min(GameState.playerLevel - 1, RANKS.length - 1)]
    ctx.fillStyle = '#ccaaff'
    ctx.font = 'bold 12px monospace'
    ctx.fillText(`${rankName}  Lv.${GameState.playerLevel}`, 462, 568)

    const EXP_THRESHOLDS = [0, 30, 80, 160, 280, 450]
    const lvl = GameState.playerLevel
    const expNeeded = lvl < EXP_THRESHOLDS.length ? EXP_THRESHOLDS[lvl] : EXP_THRESHOLDS[EXP_THRESHOLDS.length - 1]
    const expCurrent = GameState.playerExp
    const expRatio = expNeeded > 0 ? Math.min(1, expCurrent / expNeeded) : 1

    ctx.fillStyle = '#333'
    ctx.fillRect(460, 576, 200, 8)
    ctx.fillStyle = '#aa66ff'
    ctx.fillRect(460, 576, 200 * expRatio, 8)
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 1
    ctx.strokeRect(460, 576, 200, 8)

    // 처치 수
    ctx.fillStyle = '#aaa'
    ctx.font = '11px monospace'
    ctx.fillText(`처치: ${GameState.killCount}`, 670, 568)
  }

  _drawDangerOverlay(ctx, gameTime) {
    if (!GameState.playerDanger) return
    const alpha = 0.25 + 0.2 * Math.abs(Math.sin(gameTime * Math.PI * 2))
    ctx.strokeStyle = `rgba(255,50,50,${alpha})`
    ctx.lineWidth = 14
    ctx.strokeRect(7, 7, 786, 586)
  }
}

window.HUD = HUD
const _hud = new HUD()
window._hud = _hud
