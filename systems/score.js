// GDD Part 6.1 스코어 공식
function calculateFinalScore() {
  const s = GameState
  const survivalScore = Math.floor(s.gameTime) * 10
  const killScore = (s.basicKills || 0) * 5
               + (s.pcBotKills || 0) * 10
               + (s.mirrorBotKills || 0) * 30
  const aiBonus = (s.aiBotReached ? 500 : 0)
               + (s.aiBotKilled ? 1500 : 0)
  const hpBonus = Game.player ? Math.floor(Game.player.hp * 2) : 0
  const progressBonus = s.releaseProgress >= 100 ? 300 : 0
  return survivalScore + killScore + aiBonus + hpBonus + progressBonus
}

// 매 프레임 호출: 출시 진행률 업데이트 (시간 기반)
function updateReleaseProgress(deltaTime) {
  if (!GameState.isRunning || GameState.isPaused) return
  GameState.releaseProgress = Math.min(100, GameState.releaseProgress + deltaTime * 0.5)
}

// 게임 종료 시 최종 점수 확정 및 베스트 스코어 저장
function finalizeScore() {
  const final = calculateFinalScore()
  GameState.score = final
  const best = parseInt(localStorage.getItem('devsurvival_best') || '0')
  if (final > best) localStorage.setItem('devsurvival_best', String(final))
  return final
}

window.ScoreSystem = { calculateFinalScore, updateReleaseProgress, finalizeScore }
