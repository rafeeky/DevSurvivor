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
    // 로비 BGM: 전자음 베이스라인 + 멜로디 조합 (BPM 140)
    startLobbyBGM() {
      if (_bgmActive) return
      _bgmActive = true
      const ctx = _getCtx()
      // 전자음 베이스라인 + 멜로디 조합
      // BPM: 140 (더 빠름), 패턴: 2bar
      const basePattern = [
        [110, 0.214], [110, 0.107], [147, 0.214], [165, 0.107],
        [110, 0.214], [130, 0.107], [110, 0.214], [98, 0.214],
      ]
      const melody = [
        [440, 0.214], [494, 0.107], [523, 0.214], [587, 0.214],
        [523, 0.107], [494, 0.107], [440, 0.428], [0, 0.214],
        [392, 0.214], [440, 0.107], [494, 0.214], [440, 0.214],
        [392, 0.107], [349, 0.107], [392, 0.428], [0, 0.214],
      ]
      const totalDur = melody.reduce((s,[,d]) => s + d, 0)

      function scheduleLoop(startTime) {
        if (!_bgmActive) return
        let t = startTime
        // 베이스라인 (2번 반복)
        for (let r = 0; r < 2; r++) {
          basePattern.forEach(([freq, dur]) => {
            if (!freq) { t += dur; return }
            try {
              const ctx2 = _getCtx()
              const osc = ctx2.createOscillator()
              const gain = ctx2.createGain()
              osc.type = 'sawtooth'
              osc.frequency.value = freq
              gain.gain.setValueAtTime(0.06, t)
              gain.gain.setValueAtTime(0.06, t + dur * 0.8)
              gain.gain.linearRampToValueAtTime(0, t + dur)
              osc.connect(gain); gain.connect(ctx2.destination)
              osc.start(t); osc.stop(t + dur)
              _bgmNodes.push({ osc, gain })
            } catch(e) {}
            t += dur
          })
        }
        // 멜로디
        let mt = startTime
        melody.forEach(([freq, dur]) => {
          if (freq > 0) {
            try {
              const ctx2 = _getCtx()
              const osc = ctx2.createOscillator()
              const gain = ctx2.createGain()
              osc.type = 'square'
              osc.frequency.value = freq
              gain.gain.setValueAtTime(0.05, mt)
              gain.gain.setValueAtTime(0.05, mt + dur * 0.7)
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
    // BGM: 반복 멜로디 루프 (8비트 스타일, 게임용)
    startBGM() {
      if (_bgmActive) return
      _bgmActive = true
      const ctx = _getCtx()
      // 멜로디 패턴: [freq, duration]
      const melody = [
        [220,0.25],[247,0.25],[262,0.25],[294,0.5],
        [330,0.25],[294,0.25],[262,0.25],[247,0.5],
        [220,0.25],[262,0.25],[330,0.25],[392,0.5],
        [330,0.25],[262,0.25],[247,0.25],[220,1.0],
      ]
      const totalDur = melody.reduce((s,[,d]) => s + d, 0)
      function scheduleMelody(startTime) {
        if (!_bgmActive) return
        let t = startTime
        melody.forEach(([freq, dur]) => {
          try {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'square'
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0.04, t)
            gain.gain.setValueAtTime(0.04, t + dur * 0.7)
            gain.gain.linearRampToValueAtTime(0.0, t + dur)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(t)
            osc.stop(t + dur)
            _bgmNodes.push({ osc, gain })
          } catch(e) {}
          t += dur
        })
        // 루프 예약
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
