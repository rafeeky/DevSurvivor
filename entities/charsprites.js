/**
 * entities/charsprites.js — 플레이어 캐릭터 스프라이트 설정 & 이미지 로더
 * adam:   Tommy (sprite-pack-3, 빌드타임 RGB→RGBA 변환본)
 * amelia: Julia 오피스 캐릭터 (RGBA, 32x32)
 * alex:   Modern Tiles Alex 16x16 유지
 */

window.CHAR_CONFIGS = {
  adam: {
    label: '주니어 개발자 (남)',
    sublabel: '빠른 적응',
    roleType: '속도형',
    roleColor: '#44ffaa',
    passive: '빠른 적응',
    passiveDesc: '경험치 +20%  이동속도 +20',
    idle:   { src: 'assets/custom/player/tommy_idle.png',   fw: 32, fh: 32, frames: 4, fps: 5 },
    walk:   { src: 'assets/custom/player/tommy_walk.png',   fw: 32, fh: 32, frames: 8, fps: 10 },
    action: { src: 'assets/custom/player/tommy_action.png', fw: 32, fh: 32, frames: 1, fps: 8 },
    hit:    { src: 'assets/custom/player/tommy_hit.png',    fw: 32, fh: 32, frames: 1, fps: 8 },
    scale: 3,
    yAnchor: 0.75,
  },
  alex: {
    label: '시니어 개발자 (남)',
    sublabel: '숙련된 디버깅',
    roleType: '처리형',
    roleColor: '#ff8844',
    passive: '숙련된 디버깅',
    passiveDesc: '스킬 데미지 +20%  디버그 쿨다운 -0.5초',
    idle: { src: 'assets/custom/player/alex_idle.png', fw: 16, fh: 16, frames: 4, fps: 4 },
    walk: { src: 'assets/custom/player/alex_run.png',  fw: 16, fh: 16, frames: 6, fps: 8 },
    scale: 4,
    yAnchor: 0.75,
  },
  amelia: {
    label: '주니어 개발자 (여)',
    sublabel: '끝까지 버티기',
    roleType: '버티기형',
    roleColor: '#cc88ff',
    passive: '끝까지 버티기',
    passiveDesc: '회복량 +25%  보호막 +1  저체력 피해 -20%',
    idle:   { src: 'assets/packs/julia/Julia-Idle.png',            fw: 32, fh: 32, frames: 4, fps: 6 },
    walk:   { src: 'assets/packs/julia/Julia.png',                 fw: 32, fh: 32, frames: 4, fps: 8 },
    action: { src: 'assets/packs/julia/Julia_Drinking_Coffee.png', fw: 32, fh: 32, frames: 3, fps: 8 },
    scale: 3,
    yAnchor: 0.75,
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
