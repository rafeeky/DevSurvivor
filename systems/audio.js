;(function () {
  let _ctx = null
  let _bgmNodes = []
  let _bgmActive = false
  let _currentBGM = null

  function _getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (_ctx.state === 'suspended') _ctx.resume()
    return _ctx
  }

  function _playTone(freq, type, duration, gainVal, startDelay = 0) {
    try {
      const ctx = _getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(gainVal, ctx.currentTime + startDelay)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + startDelay)
      osc.stop(ctx.currentTime + startDelay + duration)
    } catch(e) {}
  }

  function _playNoise(duration, gainVal) {
    try {
      const ctx = _getCtx()
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
      const src = ctx.createBufferSource()
      src.buffer = buf
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(gainVal, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start()
    } catch(e) {}
  }

  const GameAudio = {
    // 플레이어 피격음: 짧은 노이즈 + 낮은 톤
    playHit() {
      _playNoise(0.12, 0.25)
      _playTone(180, 'sawtooth', 0.15, 0.12)
    },
    // 적 처치음: 상승 톤 2개
    playKill() {
      _playTone(330, 'square', 0.08, 0.1)
      _playTone(440, 'square', 0.08, 0.1, 0.06)
    },
    // 레벨업: 밝은 아르페지오
    playLevelUp() {
      [330, 392, 494, 659].forEach((f, i) => _playTone(f, 'sine', 0.18, 0.18, i * 0.07))
    },
    // 보스 등장: 드라마틱 저음 + 노이즈
    playBossIntro() {
      _playNoise(0.5, 0.4)
      _playTone(80, 'sawtooth', 1.2, 0.3)
      _playTone(60, 'square', 1.5, 0.2, 0.1)
    },
    // 승리: 밝은 팡파레
    playWin() {
      [523, 659, 784, 1047].forEach((f, i) => _playTone(f, 'sine', 0.3, 0.2, i * 0.1))
    },
    // 패배: 하강 음
    playGameOver() {
      [440, 330, 220, 110].forEach((f, i) => _playTone(f, 'sawtooth', 0.3, 0.18, i * 0.15))
    },
    // 로비 BGM: music_title.mp3
    startLobbyBGM() {
      _bgmActive = true
      try {
        _currentBGM = new Audio('assets/sounds/music_title.mp3')
        _currentBGM.loop = true
        _currentBGM.volume = 0.6
        _currentBGM.play().catch(() => {})
      } catch(e) {}
    },
    // 게임 BGM: music_play.mp3
    startBGM() {
      _bgmActive = true
      try {
        _currentBGM = new Audio('assets/sounds/music_play.mp3')
        _currentBGM.loop = true
        _currentBGM.volume = 0.5
        _currentBGM.play().catch(() => {})
      } catch(e) {}
    },
    // autoplay 차단 해제 후 재시도
    resumeBGMIfNeeded() {
      if (_currentBGM && _currentBGM.paused) {
        _currentBGM.play().catch(() => {})
      }
    },
    stopBGM() {
      _bgmActive = false
      if (_currentBGM) {
        _currentBGM.pause()
        _currentBGM.currentTime = 0
        _currentBGM = null
      }
      _bgmNodes.forEach(n => { try { n.osc.stop(); } catch(e) {} })
      _bgmNodes = []
    },
  }

  window.GameAudio = GameAudio
})()
