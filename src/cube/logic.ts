/**
 * 魔方核心逻辑：N 阶（3/4/5）状态模型、层旋转、公式解析。
 *
 * 坐标系：右手系
 *   +X = R(右)   -X = L(左)
 *   +Y = U(上)   -Y = D(下)
 *   +Z = F(前)   -Z = B(后)
 *
 * 每个小块(cubie)保存：
 *   p: 当前位置（以块为单位，N 为奇数时为整数，偶数时为半整数）
 *   m: 3x3 整数旋转矩阵（把"复原态的局部方向"映射到"当前世界方向"）
 *   stickers: 6 个局部面（+X,-X,+Y,-Y,+Z,-Z）对应的贴纸颜色
 */

export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'
export type Vec3 = [number, number, number]
export type Mat3 = number[] // 9 个数，行优先

export const FACES: Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/** 该面法线所在的轴 0=X 1=Y 2=Z */
export const AXIS_OF_FACE: Record<Face, 0 | 1 | 2> = {
  R: 0, L: 0, U: 1, D: 1, F: 2, B: 2,
}
/** 该面法线在轴上的正负 */
export const SIGN_OF_FACE: Record<Face, 1 | -1> = {
  R: 1, L: -1, U: 1, D: -1, F: 1, B: -1,
}

export const FACE_COLOR: Record<Face, string> = {
  U: '#f7f9fc', // 白
  D: '#fcd34d', // 黄
  F: '#22c55e', // 绿
  B: '#2563eb', // 蓝
  R: '#ef4444', // 红
  L: '#fb923c', // 橙
}

export const FACE_CN: Record<Face, string> = {
  U: '上', D: '下', L: '左', R: '右', F: '前', B: '后',
}

/** 一条"单层转动"指令 */
export interface LayerMove {
  axis: 0 | 1 | 2
  /** 层坐标，例如 3 阶 R 面为 1，4 阶 R 面为 1.5 */
  layer: number
  /** 绕该轴正方向旋转的 90° 圈数：-1 / 1 / 2 */
  quarter: -1 | 1 | 2 | -2
}

/** 可展开为一到多条 LayerMove 的指令（整层 / 宽转 / 整体转） */
export interface Move {
  axis: 0 | 1 | 2
  layers: number[]
  quarter: -1 | 1 | 2 | -2
  whole?: boolean
}

export interface Cubie {
  id: number
  p: Vec3
  m: Mat3
  /** 局部面 0:+X 1:-X 2:+Y 3:-Y 4:+Z 5:-Z */
  stickers: (Face | null)[]
}

export interface CubeState {
  order: number
  cubies: Cubie[]
}

/* ------------------------------------------------------------------ */
/* 矩阵 / 向量                                                          */
/* ------------------------------------------------------------------ */

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

/** a * b（均为行优先 3x3） */
export function mulMat(a: Mat3, b: Mat3): Mat3 {
  const out: Mat3 = new Array(9).fill(0)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let s = 0
      for (let k = 0; k < 3; k++) s += a[r * 3 + k] * b[k * 3 + c]
      out[r * 3 + c] = s
    }
  }
  return out
}

/** m * v */
export function applyMat(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

/** 绕正方向轴旋转 quarter * 90° 的矩阵（右手定则） */
export function rotationMat(axis: 0 | 1 | 2, quarter: number): Mat3 {
  const q = ((quarter % 4) + 4) % 4
  if (axis === 0) {
    if (q === 0) return [1, 0, 0, 0, 1, 0, 0, 0, 1]
    if (q === 1) return [1, 0, 0, 0, 0, -1, 0, 1, 0]
    if (q === 2) return [1, 0, 0, 0, -1, 0, 0, 0, -1]
    return [1, 0, 0, 0, 0, 1, 0, -1, 0]
  }
  if (axis === 1) {
    if (q === 0) return [1, 0, 0, 0, 1, 0, 0, 0, 1]
    if (q === 1) return [0, 0, 1, 0, 1, 0, -1, 0, 0]
    if (q === 2) return [-1, 0, 0, 0, 1, 0, 0, 0, -1]
    return [0, 0, -1, 0, 1, 0, 1, 0, 0]
  }
  if (q === 0) return [1, 0, 0, 0, 1, 0, 0, 0, 1]
  if (q === 1) return [0, -1, 0, 1, 0, 0, 0, 0, 1]
  if (q === 2) return [-1, 0, 0, 0, -1, 0, 0, 0, 1]
  return [0, 1, 0, -1, 0, 0, 0, 0, 1]
}

/* ------------------------------------------------------------------ */
/* 复原态                                                               */
/* ------------------------------------------------------------------ */

/** N 阶的层坐标数组，例如 3 阶 [-1,0,1]，4 阶 [-1.5,-0.5,0.5,1.5] */
export function layerCoords(order: number): number[] {
  const half = (order - 1) / 2
  const out: number[] = []
  for (let i = 0; i < order; i++) out.push(i - half)
  return out
}

export function createSolved(order: number): CubeState {
  const coords = layerCoords(order)
  const max = (order - 1) / 2
  const cubies: Cubie[] = []
  let id = 0
  for (const z of coords) {
    for (const y of coords) {
      for (const x of coords) {
        // 内部不可见块不渲染
        if (Math.abs(x) !== max && Math.abs(y) !== max && Math.abs(z) !== max) continue
        const p: Vec3 = [x, y, z]
        const stickers: (Face | null)[] = []
        for (let i = 0; i < 6; i++) {
          const axis = i >> 1
          const sign = i % 2 === 0 ? 1 : -1
          const outward = p[axis] === sign * max
          stickers.push(outward ? localFaceToFace(axis, sign) : null)
        }
        cubies.push({ id: id++, p, m: [...IDENTITY], stickers })
      }
    }
  }
  return { order, cubies }
}

function localFaceToFace(axis: number, sign: number): Face {
  if (axis === 0) return sign > 0 ? 'R' : 'L'
  if (axis === 1) return sign > 0 ? 'U' : 'D'
  return sign > 0 ? 'F' : 'B'
}

export function cloneState(s: CubeState): CubeState {
  return {
    order: s.order,
    cubies: s.cubies.map((c) => ({ id: c.id, p: [...c.p] as Vec3, m: [...c.m], stickers: [...c.stickers] })),
  }
}

/** 是否回到复原态：所有块的朝向矩阵都是单位矩阵 */
export function isSolved(s: CubeState): boolean {
  for (const c of s.cubies) {
    for (let i = 0; i < 9; i++) if (c.m[i] !== IDENTITY[i]) return false
  }
  return true
}

/* ------------------------------------------------------------------ */
/* 转动                                                                 */
/* ------------------------------------------------------------------ */

const EPS = 1e-6

export function cubiesInLayer(cubies: Cubie[], axis: 0 | 1 | 2, layer: number): number[] {
  const out: number[] = []
  for (let i = 0; i < cubies.length; i++) {
    if (Math.abs(cubies[i].p[axis] - layer) < EPS) out.push(i)
  }
  return out
}

/** 在状态上就地执行一次单层转动 */
export function applyLayerMove(state: CubeState, axis: 0 | 1 | 2, layer: number, quarter: number): number[] {
  const idx = cubiesInLayer(state.cubies, axis, layer)
  if (!idx.length) return idx
  const R = rotationMat(axis, quarter)
  for (const i of idx) {
    const c = state.cubies[i]
    c.p = applyMat(R, c.p)
    // 浮点安全：半整数可能累积误差
    c.p = c.p.map((v) => Math.round(v * 2) / 2) as Vec3
    c.m = mulMat(R, c.m)
  }
  return idx
}

export function applyMove(state: CubeState, move: Move): number[][] {
  const groups: number[][] = []
  for (const layer of move.layers) {
    const idx = applyLayerMove(state, move.axis, layer, move.quarter)
    if (idx.length) groups.push(idx)
  }
  return groups
}

export function invertMove(m: Move): Move {
  return { ...m, quarter: (m.quarter === 2 || m.quarter === -2 ? 2 : (m.quarter === 1 ? -1 : 1)) as -1 | 1 | 2 }
}

/* ------------------------------------------------------------------ */
/* 指令构造                                                             */
/* ------------------------------------------------------------------ */

/** 面 + 层数深度 -> 层坐标。depth 从该面起算，1 为最外层 */
export function depthToLayer(order: number, face: Face, depth: number): number {
  const max = (order - 1) / 2
  return SIGN_OF_FACE[face] * (max - (depth - 1))
}

/**
 * 构造面转动。dir: 1 顺时针(从该面外侧看)、-1 逆时针、2 转 180°
 * depth: 第几层（1 起）；wide: 同时转动的层数（1=单层，2=双层宽转）
 */
export function faceMove(order: number, face: Face, dir: 1 | -1 | 2, depth = 1, wide = 1): Move {
  const axis = AXIS_OF_FACE[face]
  const sign = SIGN_OF_FACE[face]
  // 从外侧看顺时针 = 绕外法线 -90°，即绕正轴 -sign * 90°
  let quarter = -sign * dir
  if (dir === 2) quarter = 2
  const layers: number[] = []
  for (let d = depth; d < depth + wide; d++) layers.push(depthToLayer(order, face, d))
  return { axis, layers, quarter: quarter as -1 | 1 | 2 }
}

/** 中层 M/E/S（仅奇数阶有真正的中层） */
export function sliceMove(order: number, slice: 'M' | 'E' | 'S', dir: 1 | -1 | 2): Move | null {
  if (order % 2 === 0) return null
  const face: Face = slice === 'M' ? 'L' : slice === 'E' ? 'D' : 'F'
  return faceMove(order, face, dir, (order + 1) / 2)
}

/** 整体转动 x / y / z */
export function wholeMove(order: number, axis: 'x' | 'y' | 'z', dir: 1 | -1 | 2): Move {
  const face: Face = axis === 'x' ? 'R' : axis === 'y' ? 'U' : 'F'
  const m = faceMove(order, face, dir, 1)
  m.layers = layerCoords(order)
  m.whole = true
  return m
}

/* ------------------------------------------------------------------ */
/* 公式解析                                                             */
/* ------------------------------------------------------------------ */

const TOKEN_RE = /^([0-9])?([ULDRFBMESxyz])(w)?(2)?(')?$/

export function parseNotation(order: number, text: string): Move[] {
  const tokens = text
    .replace(/[()（）]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const moves: Move[] = []
  for (const raw of tokens) {
    const m = TOKEN_RE.exec(raw)
    if (!m) continue
    const [, numStr, letter, w, two, prime] = m
    const num = numStr ? Number(numStr) : 0
    const dir: 1 | -1 | 2 = two ? 2 : prime ? -1 : 1

    if (letter === 'x' || letter === 'y' || letter === 'z') {
      moves.push(wholeMove(order, letter, dir))
      continue
    }
    if (letter === 'M' || letter === 'E' || letter === 'S') {
      const sm = sliceMove(order, letter, dir)
      if (sm) moves.push(sm)
      continue
    }
    const face = letter as Face
    if (w) {
      // Rw / 2Rw / 3Rw：宽转（含最外层）
      const width = num > 0 ? num : 2
      moves.push(faceMove(order, face, dir, 1, width))
    } else if (num > 0) {
      // 2R / 3R：从该面数第 num 层（单片内层）
      moves.push(faceMove(order, face, dir, num, 1))
    } else {
      moves.push(faceMove(order, face, dir, 1, 1))
    }
  }
  return moves
}

export function tokenize(text: string): string[] {
  return text.replace(/[()（）]/g, ' ').split(/\s+/).filter(Boolean)
}

/* ------------------------------------------------------------------ */
/* 随机打乱                                                             */
/* ------------------------------------------------------------------ */

const SCRAMBLE_FACES: Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
const DIRS: (1 | -1 | 2)[] = [1, -1, 2]

export function randomScramble(order: number, count?: number): Move[] {
  const n = count ?? (order === 3 ? 22 : order === 4 ? 34 : 46)
  const moves: Move[] = []
  let lastAxis = -1
  for (let i = 0; i < n; i++) {
    let face: Face
    let guard = 0
    do {
      face = SCRAMBLE_FACES[Math.floor(Math.random() * SCRAMBLE_FACES.length)]
      guard++
    } while (AXIS_OF_FACE[face] === lastAxis && guard < 12)
    lastAxis = AXIS_OF_FACE[face]
    // 大阶数偶尔加入宽转，更贴近真实打乱
    const useWide = order > 3 && Math.random() < 0.28
    const wide = useWide ? 2 : 1
    const dir = DIRS[Math.floor(Math.random() * DIRS.length)]
    moves.push(faceMove(order, face, dir, 1, wide))
  }
  return moves
}

/** 把 Move 反向解析成可读记号（用于历史记录展示） */
export function moveToToken(order: number, m: Move): string {
  const max = (order - 1) / 2
  if (m.whole) {
    const axis = m.axis === 0 ? 'x' : m.axis === 1 ? 'y' : 'z'
    if (Math.abs(m.quarter) === 2) return axis + '2'
    // x 遵循 R(+1)，y 遵循 U(+1)，z 遵循 F(+1)：外法线为正，顺时针 = -1
    return m.quarter === -1 ? axis : axis + "'"
  }
  const layer = m.layers[0]
  const wide = m.layers.length
  const face: Face =
    m.axis === 0 ? (layer >= 0 ? 'R' : 'L') : m.axis === 1 ? (layer >= 0 ? 'U' : 'D') : layer >= 0 ? 'F' : 'B'
  const sign = SIGN_OF_FACE[face]
  const depth = Math.round(max - Math.abs(layer)) + 1

  let base = face as string
  if (wide >= 2) base = (wide > 2 ? String(wide) : '') + face + 'w'
  else if (depth > 1) base = String(depth) + face

  if (Math.abs(m.quarter) === 2) return base + '2'
  return m.quarter === -sign ? base : base + "'"
}
