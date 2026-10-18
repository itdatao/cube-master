import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  type CubeState,
  type Cubie,
  type Move,
  type Vec3,
  FACE_COLOR,
  applyLayerMove,
  createSolved,
  cubiesInLayer,
  rotationMat,
} from './logic'

const CUBIE = 0.95
const RADIUS = 0.1
const STICKER = 0.72
const STICKER_RADIUS = 0.12

/** 局部面索引 -> 该面的外法线 */
const FACE_NORMALS: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]

function roundedRectShape(size: number, r: number): THREE.Shape {
  const s = size / 2
  const shape = new THREE.Shape()
  shape.moveTo(-s + r, -s)
  shape.lineTo(s - r, -s)
  shape.quadraticCurveTo(s, -s, s, -s + r)
  shape.lineTo(s, s - r)
  shape.quadraticCurveTo(s, s, s - r, s)
  shape.lineTo(-s + r, s)
  shape.quadraticCurveTo(-s, s, -s, s - r)
  shape.lineTo(-s, -s + r)
  shape.quadraticCurveTo(-s, -s, -s + r, -s)
  return shape
}

function makeShadowTexture(): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(49,46,129,0.34)')
  g.addColorStop(0.55, 'rgba(49,46,129,0.14)')
  g.addColorStop(1, 'rgba(49,46,129,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

interface QueuedMove {
  move: Move
  token: string
  duration: number
}

export interface EngineOptions {
  onMoveStart?: (token: string, index: number) => void
  onMoveEnd?: () => void
  onIdle?: () => void
}

export class CubeEngine {
  private container: HTMLElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private cubeRoot: THREE.Group
  private shadowMesh: THREE.Mesh
  private meshes: THREE.Group[] = []
  private state: CubeState
  private order: number

  private queue: QueuedMove[] = []
  private active: {
    pivot: THREE.Group
    indices: number[]
    axisVec: THREE.Vector3
    target: number
    start: number
    duration: number
    token: string
  } | null = null

  private raf = 0
  private clock = new THREE.Clock()
  private disposed = false
  private opts: EngineOptions
  private bodyMat: THREE.MeshStandardMaterial
  private stickerMats: Record<string, THREE.MeshStandardMaterial>
  private cubieGeo: RoundedBoxGeometry
  private stickerGeo: THREE.ShapeGeometry

  constructor(container: HTMLElement, order = 3, opts: EngineOptions = {}) {
    this.container = container
    this.opts = opts
    this.order = order
    this.state = createSolved(order)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth || 640, container.clientHeight || 480)
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.touchAction = 'none'

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(32, this.aspect, 0.1, 100)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.09
    this.controls.enablePan = false
    this.controls.rotateSpeed = 0.9
    this.controls.autoRotateSpeed = 1.1

    // 光照
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8b93b8, 0.55)
    this.scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 1.05)
    key.position.set(6, 9, 7)
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-7, -3, -6)
    this.scene.add(fill)
    const rim = new THREE.DirectionalLight(0xc7d2fe, 0.35)
    rim.position.set(-4, 6, -8)
    this.scene.add(rim)

    this.cubeRoot = new THREE.Group()
    this.scene.add(this.cubeRoot)

    this.shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.9,
      }),
    )
    this.shadowMesh.rotation.x = -Math.PI / 2
    this.scene.add(this.shadowMesh)

    // 共享几何体与材质
    this.cubieGeo = new RoundedBoxGeometry(CUBIE, CUBIE, CUBIE, 3, RADIUS)
    this.stickerGeo = new THREE.ShapeGeometry(roundedRectShape(STICKER, STICKER_RADIUS), 4)
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x171a26, roughness: 0.62, metalness: 0.08 })
    this.stickerMats = {}
    for (const [face, color] of Object.entries(FACE_COLOR)) {
      this.stickerMats[face] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.34,
        metalness: 0.02,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.05,
      })
    }

    this.build()
    this.fitCamera()

    this.clock.start()
    this.loop()
  }

  private get aspect() {
    const w = this.container.clientWidth || 640
    const h = this.container.clientHeight || 480
    return w / h
  }

  /* --------------------------- 构建 --------------------------- */

  private build() {
    for (const mesh of this.meshes) this.cubeRoot.remove(mesh)
    this.meshes = []
    for (const cubie of this.state.cubies) {
      const g = new THREE.Group()
      g.add(new THREE.Mesh(this.cubieGeo, this.bodyMat))
      for (let i = 0; i < 6; i++) {
        const face = cubie.stickers[i]
        if (!face) continue
        const n = FACE_NORMALS[i]
        const sticker = new THREE.Mesh(this.stickerGeo, this.stickerMats[face])
        sticker.position.set(n[0] * (CUBIE / 2 + 0.004), n[1] * (CUBIE / 2 + 0.004), n[2] * (CUBIE / 2 + 0.004))
        if (i === 0) sticker.rotation.y = Math.PI / 2
        else if (i === 1) sticker.rotation.y = -Math.PI / 2
        else if (i === 2) sticker.rotation.x = -Math.PI / 2
        else if (i === 3) sticker.rotation.x = Math.PI / 2
        else if (i === 5) sticker.rotation.y = Math.PI
        g.add(sticker)
      }
      this.cubeRoot.add(g)
      this.meshes.push(g)
    }
    this.syncMeshes()
    this.updateShadow()
  }

  private syncMesh(cubie: Cubie, g: THREE.Group) {
    g.position.set(cubie.p[0], cubie.p[1], cubie.p[2])
    const m = new THREE.Matrix4().set(
      cubie.m[0], cubie.m[1], cubie.m[2], 0,
      cubie.m[3], cubie.m[4], cubie.m[5], 0,
      cubie.m[6], cubie.m[7], cubie.m[8], 0,
      0, 0, 0, 1,
    )
    g.quaternion.setFromRotationMatrix(m)
  }

  private syncMeshes() {
    for (let i = 0; i < this.meshes.length; i++) this.syncMesh(this.state.cubies[i], this.meshes[i])
  }

  private updateShadow() {
    const s = this.order * 2.6
    this.shadowMesh.scale.set(s, s, 1)
    this.shadowMesh.position.y = -(this.order / 2 + 0.75)
  }

  private fitCamera() {
    const r = Math.sqrt(3) * (this.order / 2)
    const dist = (r / Math.sin((this.camera.fov * Math.PI) / 360)) * 0.82
    const dir = new THREE.Vector3(0.78, 0.72, 1).normalize()
    this.camera.position.copy(dir.multiplyScalar(dist))
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)
    this.controls.minDistance = dist * 0.55
    this.controls.maxDistance = dist * 2.4
    this.controls.update()
  }

  resetView() {
    this.fitCamera()
  }

  setAutoRotate(v: boolean) {
    this.controls.autoRotate = v
  }

  get autoRotate() {
    return this.controls.autoRotate
  }

  /* --------------------------- 阶数 --------------------------- */

  setOrder(order: number) {
    if (order === this.order) return
    this.order = order
    this.state = createSolved(order)
    this.clearQueue(true)
    this.build()
    this.fitCamera()
  }

  /* --------------------------- 转动 --------------------------- */

  get busy() {
    return this.active !== null || this.queue.length > 0
  }

  reset() {
    this.clearQueue(true)
    this.state = createSolved(this.order)
    this.syncMeshes()
  }

  /** 立即复位到指定状态（用于撤销/重做快照） */
  setState(cubies: CubeState['cubies']) {
    this.clearQueue(true)
    this.state = { order: this.order, cubies: cubies.map((c) => ({ ...c, p: [...c.p] as Vec3, m: [...c.m], stickers: [...c.stickers] })) }
    this.syncMeshes()
  }

  getState(): CubeState {
    return this.state
  }

  enqueue(moves: Move[], tokens: string[] = [], duration = 260, immediate = false) {
    if (immediate) this.clearQueue(false)
    for (let i = 0; i < moves.length; i++) {
      this.queue.push({ move: moves[i], token: tokens[i] ?? '', duration })
    }
  }

  clearQueue(finishCurrent = true) {
    this.queue = []
    if (this.active && finishCurrent) this.finishActive()
  }

  private startNext() {
    if (this.active || !this.queue.length) return
    const item = this.queue.shift()!
    const { move, token } = item
    const indices: number[] = []
    for (const layer of move.layers) {
      const idx = applyLayerMove(this.state, move.axis, layer, move.quarter)
      for (const i of idx) if (!indices.includes(i)) indices.push(i)
    }
    if (!indices.length) {
      this.opts.onMoveEnd?.()
      this.checkIdle()
      return
    }

    const pivot = new THREE.Group()
    this.cubeRoot.add(pivot)
    for (const i of indices) pivot.attach(this.meshes[i])

    const axisVec =
      move.axis === 0 ? new THREE.Vector3(1, 0, 0) : move.axis === 1 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)
    this.active = {
      pivot,
      indices,
      axisVec,
      target: (move.quarter * Math.PI) / 2,
      start: performance.now(),
      duration: Math.max(40, item.duration),
      token,
    }
    this.opts.onMoveStart?.(token, 0)
  }

  private finishActive() {
    const a = this.active
    if (!a) return
    for (const i of a.indices) this.cubeRoot.attach(this.meshes[i])
    this.cubeRoot.remove(a.pivot)
    // 用逻辑状态精确回写，避免浮点漂移
    for (const i of a.indices) this.syncMesh(this.state.cubies[i], this.meshes[i])
    this.active = null
    this.opts.onMoveEnd?.()
    this.checkIdle()
  }

  private checkIdle() {
    if (!this.active && !this.queue.length) this.opts.onIdle?.()
  }

  private update() {
    if (this.active) {
      const t = (performance.now() - this.active.start) / this.active.duration
      if (t >= 1) {
        this.active.pivot.quaternion.setFromAxisAngle(this.active.axisVec, this.active.target)
        this.finishActive()
      } else {
        const e = t * t * (3 - 2 * t) // smoothstep，丝滑无突兀
        this.active.pivot.quaternion.setFromAxisAngle(this.active.axisVec, this.active.target * e)
      }
    } else if (this.queue.length) {
      this.startNext()
    }
  }

  /* --------------------------- 循环 --------------------------- */

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = this.clock.getDelta()
    this.update()
    this.controls.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.controls.dispose()
    this.cubieGeo.dispose()
    this.stickerGeo.dispose()
    this.bodyMat.dispose()
    Object.values(this.stickerMats).forEach((m) => m.dispose())
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}

/** 供 UI 预览使用：某层包含的小块索引 */
export function layerIndices(state: CubeState, axis: 0 | 1 | 2, layer: number) {
  return cubiesInLayer(state.cubies, axis, layer)
}

export { rotationMat }
