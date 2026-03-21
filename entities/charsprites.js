/**
 * entities/charsprites.js — 플레이어 캐릭터 스프라이트 설정 & 이미지 로더
 * 세 캐릭터: adam / alex / amelia (모두 16×16 프레임, Modern tiles 팩)
 */

window.CHAR_CONFIGS = {
  adam: {
    label: '아담',
    sublabel: '남 • 개발자',
    idle: { src: 'assets/characters/Adam_idle_16x16.png', fw: 16, fh: 16, frames: 4, fps: 4 },
    walk: { src: 'assets/characters/Adam_run_16x16.png',  fw: 16, fh: 16, frames: 6, fps: 8 },
    scale: 3,
  },
  alex: {
    label: '알렉스',
    sublabel: '남 • 시니어',
    idle: { src: 'assets/characters/Alex_idle_16x16.png', fw: 16, fh: 16, frames: 4, fps: 4 },
    walk: { src: 'assets/characters/Alex_run_16x16.png',  fw: 16, fh: 16, frames: 6, fps: 8 },
    scale: 3,
  },
  amelia: {
    label: '아멜리아',
    sublabel: '여 • 개발자',
    idle: { src: 'assets/characters/Amelia_idle_16x16.png', fw: 16, fh: 16, frames: 4, fps: 4 },
    walk: { src: 'assets/characters/Amelia_run_16x16.png',  fw: 16, fh: 16, frames: 6, fps: 8 },
    scale: 3,
  },
}

// 이미지 사전 로드
window.CHAR_SPRITES = {}
;(function () {
  for (const [key, cfg] of Object.entries(window.CHAR_CONFIGS)) {
    const idle = new Image()
    idle.src = cfg.idle.src
    const walk = new Image()
    walk.src = cfg.walk.src
    window.CHAR_SPRITES[key] = { idle, walk }
  }
})()
