/**
 * entities/charsprites.js — 플레이어 캐릭터 스프라이트 설정 & 이미지 로더
 * player_m / player_f 커스텀 스프라이트 (384×768px 프레임, 4프레임 수평 배치)
 * alex는 Modern Tiles 스프라이트 유지 (차별화)
 */

window.CHAR_CONFIGS = {
  adam: {
    label: '아담',
    sublabel: '남 • 개발자',
    idle:   { src: 'assets/custom/player/player_m_idle.png',   fw: 384, fh: 768, frames: 4, fps: 6 },
    walk:   { src: 'assets/custom/player/player_m_walk.png',   fw: 384, fh: 768, frames: 4, fps: 8 },
    action: { src: 'assets/custom/player/player_m_action.png', fw: 384, fh: 768, frames: 4, fps: 8 },
    hit:    { src: 'assets/custom/player/player_m_hit.png',    fw: 384, fh: 768, frames: 4, fps: 10 },
    renderW: 48, renderH: 80,
    yAnchor: 0.92,
  },
  alex: {
    label: '알렉스',
    sublabel: '남 • 시니어',
    idle: { src: 'assets/characters/Alex_idle_16x16.png', fw: 16, fh: 16, frames: 4, fps: 4 },
    walk: { src: 'assets/characters/Alex_run_16x16.png',  fw: 16, fh: 16, frames: 6, fps: 8 },
    scale: 3,
    yAnchor: 0.75,
  },
  amelia: {
    label: '아멜리아',
    sublabel: '여 • 개발자',
    idle:   { src: 'assets/custom/player/player_f_idle.png',   fw: 384, fh: 768, frames: 4, fps: 6 },
    walk:   { src: 'assets/custom/player/player_f_walk.png',   fw: 384, fh: 768, frames: 4, fps: 8 },
    action: { src: 'assets/custom/player/player_f_action.png', fw: 384, fh: 768, frames: 4, fps: 8 },
    hit:    { src: 'assets/custom/player/player_f_hit.png',    fw: 384, fh: 768, frames: 4, fps: 10 },
    renderW: 48, renderH: 80,
    yAnchor: 0.92,
  },
}

// 이미지 사전 로드
window.CHAR_SPRITES = {}
;(function () {
  for (const [key, cfg] of Object.entries(window.CHAR_CONFIGS)) {
    const entry = {}
    for (const animKey of ['idle', 'walk', 'action', 'hit']) {
      if (cfg[animKey]) {
        const img = new Image()
        img.src = cfg[animKey].src
        entry[animKey] = img
      }
    }
    window.CHAR_SPRITES[key] = entry
  }
})()
