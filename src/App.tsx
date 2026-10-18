import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FormulaPanel from './components/FormulaPanel'
import MovePad from './components/MovePad'
import PlayerBar from './components/PlayerBar'
import {
  IconBook,
  IconClose,
  IconCompass,
  IconGauge,
  IconGrid,
  IconHand,
  IconInfo,
  IconRedo,
  IconReset,
  IconShuffle,
  IconSparkles,
  IconUndo,
} from './components/icons'
import {
  type Face,
  type Move,
  faceMove,
  invertMove,
  isSolved,
  moveToToken,
  parseNotation,
  randomScramble,
  sliceMove,
  tokenize,
  wholeMove,
} from './cube/logic'
import type { EngineOptions } from './cube/engine'
import { CURRICULA, NOTATION_HELP, type Formula } from './data/formulas'
import { useCubeEngine } from './hooks/useCubeEngine'

type Order = 3 | 4 | 5

interface HistoryItem {
  move: Move
  token: string
}

interface Playback {
  formula: Formula
  moves: Move[]
  tokens: string[]
  index: number
  auto: boolean
  fromSolved: boolean
}

const SPEEDS = [520, 440, 360, 300, 250, 205, 165, 130, 105, 85]

export default function App() {
  const [order, setOrder] = useState<Order>(3)
  const [speedIdx, setSpeedIdx] = useState(5)
  const [busy, setBusy] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [solved, setSolved] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([])
  const [playback, setPlayback] = useState<Playback | null>(null)
  const [tab, setTab] = useState<'move' | 'learn'>('move')
  const [showHelp, setShowHelp] = useState(false)

  const speedRef = useRef(SPEEDS[speedIdx])
  speedRef.current = SPEEDS[speedIdx]
  const playbackRef = useRef<Playback | null>(null)
  playbackRef.current = playback

  const optsRef = useRef<EngineOptions>({})

  const { containerRef, engineRef, ready } = useCubeEngine(order, optsRef)

  const curriculum = CURRICULA[order]

  /* ------------------------- 引擎回调 ------------------------- */

  const pushHistory = useCallback((items: HistoryItem[]) => {
    if (!items.length) return
    setHistory((h) => [...h, ...items])
    setRedoStack([])
  }, [])

  const schedule = useCallback(
    (items: HistoryItem[], duration?: number) => {
      const engine = engineRef.current
      if (!engine || !items.length) return
      engine.enqueue(
        items.map((i) => i.move),
        items.map((i) => i.token),
        duration ?? speedRef.current,
      )
      setBusy(true)
    },
    [engineRef],
  )

  /* ------------------------- 播放控制 ------------------------- */

  const gotoStep = useCallback(
    (index: number, auto: boolean) => {
      const engine = engineRef.current
      const p = playbackRef.current
      if (!engine || !p) return
      if (index < 0 || index >= p.moves.length) return
      const item = { move: p.moves[index], token: p.tokens[index] }
      const next: Playback = { ...p, index, auto }
      playbackRef.current = next
      setPlayback(next)
      pushHistory([item])
      schedule([item])
    },
    [engineRef, pushHistory, schedule],
  )

  const startFormula = useCallback(
    (f: Formula, fromSolved: boolean, auto = true) => {
      const engine = engineRef.current
      if (!engine) return
      const moves = parseNotation(order, f.notation)
      const tokens = tokenize(f.notation)
      if (!moves.length) return
      if (fromSolved) {
        engine.reset()
        setHistory([])
        setRedoStack([])
        setSolved(true)
      }
      const p: Playback = { formula: f, moves, tokens, index: -1, auto, fromSolved }
      playbackRef.current = p
      setPlayback(p)
      gotoStep(0, auto)
    },
    [engineRef, gotoStep, order],
  )

  /* ------------------------- 引擎回调 ------------------------- */

  optsRef.current = {
    onMoveStart: () => setBusy(true),
    onMoveEnd: () => {
      const engine = engineRef.current
      if (engine) setSolved(isSolved(engine.getState()))
    },
    onIdle: () => {
      setBusy(false)
      const engine = engineRef.current
      if (engine) setSolved(isSolved(engine.getState()))
      const p = playbackRef.current
      if (!p || !engine) return

      if (p.index >= p.moves.length - 1) {
        if (p.auto) {
          const next = { ...p, auto: false }
          playbackRef.current = next
          setPlayback(next)
        }
        return
      }
      if (p.auto) gotoStep(p.index + 1, true)
    },
  }

  const stepForward = useCallback(() => {
    const p = playbackRef.current
    if (!p || busy) return
    if (p.index >= p.moves.length - 1) return
    gotoStep(p.index + 1, false)
  }, [busy, gotoStep])

  const stepBack = useCallback(() => {
    const p = playbackRef.current
    if (!p || busy || p.index < 0) return
    const engine = engineRef.current
    if (!engine) return
    const item = { move: p.moves[p.index], token: p.tokens[p.index] }
    const inv: HistoryItem = { move: invertMove(item.move), token: moveToToken(order, invertMove(item.move)) }
    const next: Playback = { ...p, index: p.index - 1, auto: false }
    playbackRef.current = next
    setPlayback(next)
    setHistory((h) => h.slice(0, -1))
    setRedoStack((r) => [...r, item])
    schedule([inv])
  }, [busy, engineRef, order, schedule])

  const togglePlay = useCallback(() => {
    const p = playbackRef.current
    if (!p) return
    if (p.auto) {
      const next = { ...p, auto: false }
      playbackRef.current = next
      setPlayback(next)
      return
    }
    // 已播完则重播
    if (p.index >= p.moves.length - 1) {
      startFormula(p.formula, p.fromSolved, true)
      return
    }
    gotoStep(p.index + 1, true)
  }, [gotoStep, startFormula])

  const closePlayback = useCallback(() => {
    playbackRef.current = null
    setPlayback(null)
  }, [])

  /* ------------------------- 通用动作 ------------------------- */

  const doMove = useCallback(
    (move: Move, token: string) => {
      const item = { move, token }
      pushHistory([item])
      schedule([item])
      playbackRef.current = null
      setPlayback(null)
    },
    [pushHistory, schedule],
  )

  const undo = useCallback(() => {
    if (busy) return
    const last = history[history.length - 1]
    const engine = engineRef.current
    if (!last || !engine) return
    const inv: HistoryItem = { move: invertMove(last.move), token: moveToToken(order, invertMove(last.move)) }
    setHistory((h) => h.slice(0, -1))
    setRedoStack((r) => [...r, last])
    schedule([inv])
    const p = playbackRef.current
    if (p && p.index >= 0) {
      const next = { ...p, index: p.index - 1, auto: false }
      playbackRef.current = next
      setPlayback(next)
    }
  }, [busy, engineRef, history, order, schedule])

  const redo = useCallback(() => {
    if (busy) return
    const last = redoStack[redoStack.length - 1]
    if (!last) return
    setRedoStack((r) => r.slice(0, -1))
    pushHistory([last])
    schedule([last])
  }, [busy, pushHistory, redoStack, schedule])

  const scramble = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.reset()
    const moves = randomScramble(order)
    const tokens = moves.map((m) => moveToToken(order, m))
    setHistory([])
    setRedoStack([])
    playbackRef.current = null
    setPlayback(null)
    setSolved(false)
    schedule(
      moves.map((m, i) => ({ move: m, token: tokens[i] })),
      Math.min(150, speedRef.current),
    )
  }, [engineRef, order, schedule])

  const resetCube = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.reset()
    setHistory([])
    setRedoStack([])
    playbackRef.current = null
    setPlayback(null)
    setSolved(true)
    setBusy(false)
  }, [engineRef])

  useEffect(() => {
    setHistory([])
    setRedoStack([])
    playbackRef.current = null
    setPlayback(null)
    setSolved(true)
  }, [order])

  /* ------------------------- 键盘 ------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const k = e.key.toLowerCase()
      if (k === ' ') {
        e.preventDefault()
        if (playbackRef.current) togglePlay()
        return
      }
      const dir: 1 | -1 = e.shiftKey ? -1 : 1
      let move: Move | null = null
      if ('udlrfb'.includes(k) && k.length === 1) {
        move = faceMove(order, k.toUpperCase() as Face, dir, 1, 1)
      } else if ('mes'.includes(k)) {
        move = sliceMove(order, k.toUpperCase() as 'M' | 'E' | 'S', dir)
      } else if ('xyz'.includes(k)) {
        move = wholeMove(order, k as 'x' | 'y' | 'z', dir)
      }
      if (move) {
        e.preventDefault()
        doMove(move, moveToToken(order, move))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doMove, order, togglePlay])

  const recent = useMemo(() => history.slice(-16).map((h) => h.token), [history])

  return (
    <div className="app-bg min-h-full">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-[0_6px_16px_rgba(79,70,229,0.35)]">
              <IconGrid width={18} height={18} />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold tracking-tight text-brand-900">魔方学院</div>
              <div className="text-[10.5px] font-medium text-brand-700/60">3D 扭转 · 公式教程</div>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-brand-200/70 sm:block" />

          {/* 阶数 */}
          <div className="seg !rounded-xl">
            {([3, 4, 5] as Order[]).map((o) => (
              <button
                key={o}
                className="seg-item !px-3 !text-[13px]"
                data-active={order === o}
                onClick={() => setOrder(o)}
              >
                {o} 阶
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <button onClick={scramble} disabled={busy} className="btn">
              <IconShuffle width={15} height={15} />
              打乱
            </button>
            <button onClick={resetCube} className="btn btn-primary">
              <IconReset width={15} height={15} />
              一键还原
            </button>
            <button onClick={() => setShowHelp(true)} className="btn !px-2.5" title="记号说明">
              <IconInfo width={15} height={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 主体 */}
      <main className="mx-auto max-w-[1440px] px-3 pb-5 pt-3 sm:px-5">
        <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_384px]">
          {/* 3D 视口 */}
          <section className="card relative overflow-hidden">
            <div
              ref={containerRef}
              className="cube-canvas h-[46vh] min-h-[340px] w-full sm:h-[54vh] lg:h-[calc(100vh-176px)] lg:min-h-[420px]"
            />

            {/* 左上状态 */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
              <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-white/80 px-2.5 py-1.5 text-[12px] font-bold text-brand-900 shadow-[0_2px_10px_rgba(49,46,129,0.12)] backdrop-blur">
                {order} 阶 · {curriculum.label}
              </div>
              {solved && !busy && (
                <div className="pop-in flex items-center gap-1.5 rounded-xl bg-emerald-500 px-2.5 py-1.5 text-[12px] font-bold text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]">
                  <IconSparkles width={14} height={14} />
                  已复原
                </div>
              )}
              {history.length > 0 && !solved && (
                <div className="rounded-xl bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-brand-700/80 backdrop-blur">
                  已转 {history.length} 步
                </div>
              )}
            </div>

            {/* 右上视角 */}
            <div className="absolute right-3 top-3 flex flex-col gap-1.5">
              <button
                onClick={() => {
                  const v = !autoRotate
                  setAutoRotate(v)
                  engineRef.current?.setAutoRotate(v)
                }}
                className={`btn !px-2.5 !py-1.5 !text-[12px] ${autoRotate ? '!bg-brand-600 !text-white' : ''}`}
                title="自动旋转"
              >
                <IconCompass width={14} height={14} />
              </button>
              <button
                onClick={() => engineRef.current?.resetView()}
                className="btn !px-2.5 !py-1.5 !text-[12px]"
                title="重置视角"
              >
                <IconReset width={14} height={14} />
              </button>
            </div>

            {/* 底部提示 / 播放器 */}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
              {playback ? (
                <PlayerBar
                  formula={playback.formula}
                  index={playback.index}
                  auto={playback.auto}
                  onToggle={togglePlay}
                  onStepBack={stepBack}
                  onStepForward={stepForward}
                  onClose={closePlayback}
                />
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11.5px] font-medium text-brand-700/80 backdrop-blur">
                  <IconHand width={14} height={14} />
                  拖动旋转视角 · 滚轮缩放 · 键盘 R/L/U/D/F/B 直接扭动（Shift 逆时针）
                </div>
              )}
            </div>
          </section>

          {/* 侧栏 */}
          <aside className="card flex max-h-[calc(100vh-176px)] min-h-[420px] flex-col p-3">
            <div className="seg mb-3">
              <button className="seg-item !py-2 !text-[13px]" data-active={tab === 'move'} onClick={() => setTab('move')}>
                扭转台
              </button>
              <button className="seg-item !py-2 !text-[13px]" data-active={tab === 'learn'} onClick={() => setTab('learn')}>
                <span className="inline-flex items-center justify-center gap-1.5">
                  <IconBook width={14} height={14} />
                  公式教程
                </span>
              </button>
            </div>

            <div className="scroll-thin -mr-1 flex-1 overflow-y-auto pr-1">
              {tab === 'move' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={undo} disabled={busy || !history.length} className="btn !py-2 !text-[12.5px]">
                      <IconUndo width={14} height={14} />
                      撤销
                    </button>
                    <button onClick={redo} disabled={busy || !redoStack.length} className="btn !py-2 !text-[12.5px]">
                      <IconRedo width={14} height={14} />
                      重做
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/60 p-3">
                    <MovePad order={order} onMove={doMove} />
                  </div>

                  {/* 速度 */}
                  <div className="rounded-2xl border border-white/70 bg-white/60 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-brand-900/70">
                      <span className="inline-flex items-center gap-1.5">
                        <IconGauge width={14} height={14} />
                        转动速度
                      </span>
                      <span className="text-[11px] font-medium text-brand-700/60">
                        {speedIdx >= 7 ? '快' : speedIdx >= 4 ? '适中' : '慢'} · {SPEEDS[speedIdx]}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={9}
                      step={1}
                      value={speedIdx}
                      onChange={(e) => setSpeedIdx(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-brand-200 accent-brand-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] font-medium text-brand-700/50">
                      <span>慢速看清</span>
                      <span>快速连贯</span>
                    </div>
                  </div>

                  {/* 历史 */}
                  <div className="rounded-2xl border border-white/70 bg-white/60 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-brand-900/70">
                      <span>操作记录</span>
                      <span className="text-[11px] font-medium text-brand-700/60">共 {history.length} 步</span>
                    </div>
                    {recent.length ? (
                      <div className="flex flex-wrap gap-1">
                        {recent.map((t, i) => (
                          <span
                            key={i}
                            className={`chip min-w-[22px] bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-700 ring-1 ring-brand-100 ${
                              i === recent.length - 1 ? 'ring-2 ring-brand-400' : ''
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-brand-700/55">还没有转动记录，先点上面的面按钮试试。</p>
                    )}
                  </div>
                </div>
              ) : (
                <FormulaPanel curriculum={curriculum} activeId={playback?.formula.id ?? null} onPlay={(f, from) => startFormula(f, from, true)} />
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* 记号说明 */}
      {showHelp && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-brand-900/25 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="pop-in max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-soft scroll-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-brand-900">记号速查</h3>
              <button onClick={() => setShowHelp(false)} className="btn !px-2 !py-1.5">
                <IconClose width={15} height={15} />
              </button>
            </div>
            <div className="space-y-1.5">
              {NOTATION_HELP.map((n) => (
                <div key={n.token} className="flex gap-3 rounded-xl bg-brand-50/70 px-3 py-2">
                  <code className="w-[92px] shrink-0 font-mono text-[12px] font-bold text-brand-800">{n.token}</code>
                  <span className="text-[12px] leading-relaxed text-brand-700/85">{n.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12px] leading-relaxed text-emerald-800">
              小技巧：连续做 6 次 <b>R U R' U'</b>（Sexy Move），魔方会回到原样，可以拿来练手感。
            </div>
          </div>
        </div>
      )}

      {!ready && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-50/60 text-sm font-semibold text-brand-700">
          正在加载 3D 场景…
        </div>
      )}
    </div>
  )
}
