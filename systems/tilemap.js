/**
 * systems/tilemap.js — Modern tiles Room_Builder 타일맵 배경 렌더러
 * 타일셋: assets/backgrounds/tileset_room.png (272×368, 17×23 tiles, 16px each)
 * 캔버스: 800×600, 타일 스케일 2× → 32px 표시
 *
 * 타일 좌표 (col, row) — 0-indexed, tileset 기준
 * Row_Builder 레이아웃 추정:
 *   row 0: 빈 타일 / 벽 상단
 *   row 1: 바닥 타일 (기본)
 *   row 2: 바닥 타일 변형
 *   row 3~: 벽/가구
 */

window.TilemapSystem = (() => {
  const TILE = 16
  const SCALE = 2
  const TSIZE = TILE * SCALE  // 32px

  // 캔버스 25×19 타일 (800/32=25, 600/32=18.75)
  const COLS = 25
  const ROWS = 19

  // ─── 타일셋 좌표 상수 (col, row) ──────────────────────────
  // Room_Builder_free_16x16.png 17열×23행
  // 오피스 배경에 맞게 추정한 타일 좌표
  const T = {
    FLOOR:      [0, 1],   // 기본 바닥
    FLOOR_ALT:  [1, 1],   // 바닥 변형
    FLOOR_DARK: [2, 1],   // 어두운 바닥
    WALL_TOP:   [0, 0],   // 상단 벽
    WALL_SIDE:  [3, 0],   // 측면 벽
    CORNER_TL:  [0, 2],   // 모서리
    CORNER_TR:  [2, 2],
    CORNER_BL:  [0, 4],
    CORNER_BR:  [2, 4],
    DESK:       [4, 3],   // 책상
    PLANT:      [8, 2],   // 화분
    CARPET:     [5, 1],   // 카펫
  }

  // ─── 타일맵 정의 (25×19) ──────────────────────────────────
  // F=바닥, W=벽(상단), A=바닥변형, D=어두운바닥
  // 상단 2행은 HUD가 가리므로 벽 처리
  const F = 'F', A = 'A', D = 'D', W = 'W', C = 'C'  // C=카펫

  const MAP = [
    // row 0 (HUD 아래, y=0)
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    // row 1
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 2
    [W,F,C,C,C,F,F,F,A,A,A,A,F,F,F,D,D,F,F,F,C,C,C,F,W],
    // row 3
    [W,F,C,C,C,F,F,F,A,A,A,A,F,F,F,D,D,F,F,F,C,C,C,F,W],
    // row 4
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 5
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 6
    [W,F,A,A,A,A,F,F,F,C,C,C,F,F,F,A,A,A,A,F,F,F,F,F,W],
    // row 7
    [W,F,A,A,A,A,F,F,F,C,C,C,F,F,F,A,A,A,A,F,F,F,F,F,W],
    // row 8
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 9 (중간)
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 10
    [W,F,D,D,F,F,F,A,A,A,A,F,F,F,C,C,C,F,F,F,D,D,F,F,W],
    // row 11
    [W,F,D,D,F,F,F,A,A,A,A,F,F,F,C,C,C,F,F,F,D,D,F,F,W],
    // row 12
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 13
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 14
    [W,F,C,C,C,F,F,F,A,A,A,F,F,F,F,D,D,F,F,F,C,C,C,F,W],
    // row 15
    [W,F,C,C,C,F,F,F,A,A,A,F,F,F,F,D,D,F,F,F,C,C,C,F,W],
    // row 16
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 17 (HUD 바닥 근처)
    [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
    // row 18
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  ]

  // 타일 코드 → tileset (col, row) 매핑
  const TILE_LOOKUP = {
    F: T.FLOOR,
    A: T.FLOOR_ALT,
    D: T.FLOOR_DARK,
    W: T.WALL_TOP,
    C: T.CARPET,
  }

  // ─── 타일셋 이미지 ─────────────────────────────────────────
  const _img = new Image()
  _img.src = 'assets/backgrounds/tileset_room.png'
  let _loaded = false
  _img.onload = () => { _loaded = true }

  // ─── 오프스크린 캔버스 (첫 로드 후 한 번 렌더 → 이후 blit) ─
  let _offscreen = null
  let _offCtx = null
  let _baked = false

  function _bake() {
    if (!_loaded) return
    _offscreen = document.createElement('canvas')
    _offscreen.width  = 800
    _offscreen.height = 600
    _offCtx = _offscreen.getContext('2d')
    _offCtx.imageSmoothingEnabled = false

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const code = MAP[row]?.[col] ?? 'F'
        const [tc, tr] = TILE_LOOKUP[code] ?? T.FLOOR
        _offCtx.drawImage(
          _img,
          tc * TILE, tr * TILE, TILE, TILE,
          col * TSIZE, row * TSIZE, TSIZE, TSIZE
        )
      }
    }
    _baked = true
  }

  // ─── 공개 API ─────────────────────────────────────────────
  return {
    render(ctx) {
      if (!_baked) {
        if (_loaded) _bake()
        else {
          // 폴백: 단색 배경
          ctx.fillStyle = '#1a1a2a'
          ctx.fillRect(0, 0, 800, 600)
          return
        }
      }
      ctx.drawImage(_offscreen, 0, 0)
    },
  }
})()
