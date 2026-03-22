;(function () {
  let _ctx = null
  let _bgmNodes = []
  let _bgmActive = false

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
    // 로비 BGM: 긴박하고 드라마틱 (BPM 160)
    startLobbyBGM() {
      if (_bgmActive) return
      _bgmActive = true
      const ctx = _getCtx()
      // BPM 160 - 빠른 전자음 베이스 + 긴장감 있는 멜로디
      const basePattern = [
        [110, 0.188], [110, 0.094], [165, 0.094], [147, 0.188],
        [110, 0.094], [165, 0.094], [196, 0.188], [165, 0.188],
        [110, 0.188], [110, 0.094], [147, 0.094], [123, 0.188],
        [110, 0.094], [98, 0.094], [110, 0.375], [0, 0.188],
      ]
      const melody = [
        [659, 0.188], [0, 0.094], [659, 0.094], [698, 0.188],
        [659, 0.188], [0, 0.094], [587, 0.094], [659, 0.375],
        [523, 0.188], [0, 0.094], [523, 0.094], [587, 0.188],
        [523, 0.188], [494, 0.094], [440, 0.094], [494, 0.375],
        [587, 0.188], [0, 0.094], [587, 0.094], [659, 0.188],
        [587, 0.188], [0, 0.094], [523, 0.094], [587, 0.375],
        [440, 0.188], [494, 0.188], [523, 0.188], [587, 0.188],
        [659, 0.375], [0, 0.188], [659, 0.188], [0, 0.188],
      ]
      const totalDur = melody.reduce((s,[,d]) => s + d, 0)
      function scheduleLoop(startTime) {
        if (!_bgmActive) return
        let t = startTime
        for (let r = 0; r < 2; r++) {
          basePattern.forEach(([freq, dur]) => {
            if (!freq) { t += dur; return }
            try {
              const ctx2 = _getCtx()
              const osc = ctx2.createOscillator()
              const gain = ctx2.createGain()
              osc.type = 'sawtooth'
              osc.frequency.value = freq
              gain.gain.setValueAtTime(0.07, t)
              gain.gain.setValueAtTime(0.07, t + dur * 0.75)
              gain.gain.linearRampToValueAtTime(0, t + dur)
              osc.connect(gain); gain.connect(ctx2.destination)
              osc.start(t); osc.stop(t + dur)
              _bgmNodes.push({ osc, gain })
            } catch(e) {}
            t += dur
          })
        }
        let mt = startTime
        melody.forEach(([freq, dur]) => {
          if (freq > 0) {
            try {
              const ctx2 = _getCtx()
              const osc = ctx2.createOscillator()
              const gain = ctx2.createGain()
              osc.type = 'square'
              osc.frequency.value = freq
              gain.gain.setValueAtTime(0.06, mt)
              gain.gain.setValueAtTime(0.06, mt + dur * 0.6)
              gain.gain.linearRampToValueAtTime(0, mt + dur)
              osc.connect(gain); gain.connect(ctx2.destination)
              osc.start(mt); osc.stop(mt + dur)
              _bgmNodes.push({ osc, gain })
            } catch(e) {}
          }
          mt += dur
        })
        setTimeout(() => scheduleLoop(_getCtx().currentTime + 0.05), (totalDur - 0.5) * 1000)
      }
      scheduleLoop(ctx.currentTime + 0.1)
    },
    // BGM: 느리고 편안한 8비트 분위기 (BPM 90)
    startBGM() {
      if (_bgmActive) return
      _bgmActive = true
      const ctx = _getCtx()
      // BPM 90 - 느리고 편안한 8비트 분위기
      const melody = [
        [262, 0.5], [294, 0.5], [330, 0.5], [349, 0.5],
        [392, 1.0], [0, 0.5],
        [330, 0.5], [294, 0.5], [262, 0.5], [294, 0.5],
        [330, 1.0], [0, 0.5],
        [262, 0.5], [330, 0.5], [392, 0.5], [440, 0.5],
        [494, 1.0], [0, 0.5],
        [440, 0.5], [392, 0.5], [330, 0.5], [294, 0.5],
        [262, 1.5], [0, 0.5],
      ]
      const totalDur = melody.reduce((s,[,d]) => s + d, 0)
      function scheduleMelody(startTime) {
        if (!_bgmActive) return
        let t = startTime
        melody.forEach(([freq, dur]) => {
          if (freq > 0) {
            try {
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.type = 'triangle'
              osc.frequency.value = freq
              gain.gain.setValueAtTime(0.05, t)
              gain.gain.setValueAtTime(0.05, t + dur * 0.75)
              gain.gain.linearRampToValueAtTime(0.0, t + dur)
              osc.connect(gain)
              gain.connect(ctx.destination)
              osc.start(t)
              osc.stop(t + dur)
              _bgmNodes.push({ osc, gain })
            } catch(e) {}
          }
          t += dur
        })
        setTimeout(() => scheduleMelody(ctx.currentTime + 0.05), (totalDur - 0.5) * 1000)
      }
      scheduleMelody(ctx.currentTime + 0.05)
    },
    stopBGM() {
      _bgmActive = false
      _bgmNodes.forEach(n => { try { n.osc.stop(); } catch(e) {} })
      _bgmNodes = []
    },
  }

  window.GameAudio = GameAudio
})()
