/**
 * systems/tilemap.js — 스크롤 가능한 2400×1800 오피스 월드
 * 타일셋: assets/backgrounds/tileset_room.png (272×368, 17×23 tiles, 16px each)
 * 캔버스: 800×600 (뷰포트), 월드: 2400×1800
 * 타일 스케일 2× → 32px 표시
 */

window.WORLD_W = 2400
window.WORLD_H = 1800

window.TilemapSystem = (() => {
  const TILE  = 16
  const SCALE = 2
  const TSIZE = TILE * SCALE  // 32px

  const WORLD_COLS = window.WORLD_W / TSIZE  // 75
  const WORLD_ROWS = window.WORLD_H / TSIZE  // 56

  // ─── 타일셋 좌표 상수 (col, row) ──────────────────────────
  const T = {
    FLOOR:      [0, 1],
    FLOOR_ALT:  [1, 1],
    FLOOR_DARK: [2, 1],
    WALL_TOP:   [0, 0],
    CARPET:     [5, 1],
  }

  // ─── 세계 타일맵 생성 ────────────────────────────────────
  // 여러 오피스 구역이 이어지는 대형 맵
  // F=기본바닥  A=변형바닥  D=어두운바닥  C=카펫  W=벽
  const F = 'F', A = 'A', D = 'D', C = 'C', W = 'W'

  // 75×56 맵을 구역별로 생성
  function _buildWorldMap() {
    const map = []
    for (let r = 0; r < WORLD_ROWS; r++) {
      map.push(new Array(WORLD_COLS).fill(F))
    }

    // 벽 경계 (맵 전체 테두리)
    for (let c = 0; c < WORLD_COLS; c++) {
      map[0][c] = W; map[WORLD_ROWS - 1][c] = W
    }
    for (let r = 0; r < WORLD_ROWS; r++) {
      map[r][0] = W; map[r][WORLD_COLS - 1] = W
    }

    // ── 구역 1: 개발팀 오피스 (좌상단) ────────────────
    // 책상 구역 (카펫 패턴)
    _fillRect(map, 2, 2, 20, 8, C)
    _fillRect(map, 3, 3, 4, 3, A)    // 책상 1
    _fillRect(map, 9, 3, 4, 3, A)    // 책상 2
    _fillRect(map, 15, 3, 4, 3, A)   // 책상 3

    // 구역 2: 회의실 (상단 중앙)
    _fillRect(map, 26, 2, 22, 12, D)
    _fillRect(map, 29, 4, 16, 7, C)  // 회의 테이블

    // 구역 3: 서버실 (상단 우측)
    _fillRect(map, 52, 2, 20, 10, D)
    _fillRect(map, 54, 4, 4, 6, A)
    _fillRect(map, 60, 4, 4, 6, A)
    _fillRect(map, 66, 4, 4, 6, A)

    // ── 구역 4: 메인 오픈플랜 오피스 (중앙) ──────────
    _fillRect(map, 2, 14, 70, 24, F)
    // 책상 군집들 (중앙)
    for (let group = 0; group < 4; group++) {
      const baseC = 6 + group * 17
      const baseR = 16
      _fillRect(map, baseC,   baseR, 5, 4, C)
      _fillRect(map, baseC+8, baseR, 5, 4, C)
      _fillRect(map, baseC,   baseR+7, 5, 4, C)
      _fillRect(map, baseC+8, baseR+7, 5, 4, C)
      // 개인 책상 (변형 바닥)
      _fillRect(map, baseC+1,   baseR+1, 3, 2, A)
      _fillRect(map, baseC+9,   baseR+1, 3, 2, A)
      _fillRect(map, baseC+1,   baseR+8, 3, 2, A)
      _fillRect(map, baseC+9,   baseR+8, 3, 2, A)
    }

    // ── 구역 5: 휴게실 (하단 좌측) ───────────────────
    _fillRect(map, 2, 40, 20, 14, C)
    _fillRect(map, 4, 42, 8, 5, A)   // 소파/테이블 구역
    _fillRect(map, 14, 42, 5, 5, D)  // 자판기 구역

    // ── 구역 6: 중간 복도 ─────────────────────────────
    _fillRect(map, 2, 12, 70, 2, D)   // 수평 복도
    _fillRect(map, 2, 38, 70, 2, D)   // 수평 복도 2
    _fillRect(map, 36, 2,  2, 52, D)  // 수직 복도

    // ── 구역 7: 기획팀 오피스 (중앙 우측) ────────────
    _fillRect(map, 40, 14, 30, 24, F)
    _fillRect(map, 42, 16, 12, 8, C)
    _fillRect(map, 58, 16, 10, 8, C)
    _fillRect(map, 42, 27, 12, 8, A)
    _fillRect(map, 58, 27, 10, 8, A)

    // ── 구역 8: 보스룸 (하단 우측) ───────────────────
    _fillRect(map, 52, 40, 20, 14, D)
    _fillRect(map, 55, 43, 13, 8, C)  // 보스 책상 카펫

    // ── 구역 9: 하단 복도 / 창고 ─────────────────────
    _fillRect(map, 24, 40, 26, 14, F)
    _fillRect(map, 26, 43, 8, 6, A)
    _fillRect(map, 36, 43, 8, 6, D)

    return map
  }

  function _fillRect(map, c, r, w, h, code) {
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        const row = r + dr, col = c + dc
        if (row >= 0 && row < WORLD_ROWS && col >= 0 && col < WORLD_COLS) {
          map[row][col] = code
        }
      }
    }
  }

  const TILE_LOOKUP = { F: T.FLOOR, A: T.FLOOR_ALT, D: T.FLOOR_DARK, W: T.WALL_TOP, C: T.CARPET }

  // ─── 타일셋 이미지 ─────────────────────────────────────
  const _img = new Image()
  _img.src = 'assets/backgrounds/tileset_room.png'
  let _loaded = false
  _img.onload = () => { _loaded = true }

  // ─── 오프스크린 캔버스 (전체 월드 한 번 렌더 → blit) ──
  let _offscreen = null
  let _baked = false
  const _worldMap = _buildWorldMap()

  function _bake() {
    if (!_loaded) return
    _offscreen = document.createElement('canvas')
    _offscreen.width  = window.WORLD_W
    _offscreen.height = window.WORLD_H
    const offCtx = _offscreen.getContext('2d')
    offCtx.imageSmoothingEnabled = false

    for (let row = 0; row < WORLD_ROWS; row++) {
      for (let col = 0; col < WORLD_COLS; col++) {
        const code = _worldMap[row]?.[col] ?? 'F'
        const [tc, tr] = TILE_LOOKUP[code] ?? T.FLOOR
        offCtx.drawImage(
          _img,
          tc * TILE, tr * TILE, TILE, TILE,
          col * TSIZE, row * TSIZE, TSIZE, TSIZE
        )
      }
    }
    _baked = true
  }

  // ─── 공개 API ─────────────────────────────────────────
  return {
    // camX, camY: 뷰포트 카메라 위치 (월드 좌표)
    render(ctx, camX, camY) {
      const cx = camX || 0, cy = camY || 0
      if (!_baked) {
        if (_loaded) _bake()
        else {
          ctx.fillStyle = '#1a1a2a'
          ctx.fillRect(0, 0, 800, 600)
          return
        }
      }
      // 월드 오프스크린에서 뷰포트 영역만 blit
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(_offscreen, cx, cy, 800, 600, 0, 0, 800, 600)
    },
  }
})()
