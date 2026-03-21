/**
 * entities/enemysprites.js — 적 스프라이트 설정 & 이미지 로더
 * Sprite Pack 3 → 5종 적 매핑
 * BoxBot=GumBot / CartBot=Tommy / PCBot=RobotJ5 / MirrorBot=Twiggy / AIBot=Geralt
 */

window.ENEMY_SPRITE_CONFIGS = {
  BoxBot: {
    idle: { src: 'assets/enemies/GumBot_idle.png', fw: 32, fh: 32, frames: 4, fps: 4 },
    walk: { src: 'assets/enemies/GumBot_walk.png', fw: 32, fh: 32, frames: 6, fps: 8 },
    scale: 2,
  },
  CartBot: {
    idle: { src: 'assets/enemies/Tommy_idle.png', fw: 32, fh: 32, frames: 4, fps: 4 },
    walk: { src: 'assets/enemies/Tommy_run.png',  fw: 32, fh: 32, frames: 8, fps: 12 },
    scale: 2,
  },
  PCBot: {
    idle: { src: 'assets/enemies/RobotJ5_idle.png', fw: 32, fh: 32, frames: 5, fps: 4 },
    walk: { src: 'assets/enemies/RobotJ5_walk.png', fw: 32, fh: 32, frames: 6, fps: 6 },
    scale: 2,
  },
  MirrorBot: {
    idle: { src: 'assets/enemies/Twiggy_idle.png', fw: 32, fh: 32, frames: 5, fps: 5 },
    walk: { src: 'assets/enemies/Twiggy_run.png',  fw: 32, fh: 32, frames: 6, fps: 10 },
    scale: 2,
  },
  AIBot: {
    idle: { src: 'assets/enemies/Geralt_idle.png', fw: 32, fh: 32, frames: 2, fps: 2 },
    walk: { src: 'assets/enemies/Geralt_run.png',  fw: 32, fh: 32, frames: 3, fps: 6 },
    scale: 3,
  },
}

// 이미지 사전 로드
window.ENEMY_SPRITES = {}
;(function () {
  for (const [key, cfg] of Object.entries(window.ENEMY_SPRITE_CONFIGS)) {
    const idle = new Image()
    idle.src = cfg.idle.src
    const walk = new Image()
    walk.src = cfg.walk.src
    window.ENEMY_SPRITES[key] = { idle, walk }
  }
})()
