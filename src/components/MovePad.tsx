import { useEffect, useMemo, useState } from 'react'
import {
  type Face,
  type Move,

  FACE_CN,
  FACE_COLOR,
  faceMove,
  moveToToken,
  sliceMove,
  wholeMove,
} from '../cube/logic'
import { IconInfo, IconLayers } from './icons'

type Dir = 1 | -1 | 2

interface Range {
  label: string
  depth: number
  wide: number
}

const DIRS: { value: Dir; label: string; hint: string }[] = [
  { value: 1, label: '↻', hint: '顺时针 90°' },
  { value: -1, label: '↺', hint: '逆时针 90°' },
  { value: 2, label: '180', hint: '转 180°' },
]

const FACE_LAYOUT: Face[][] = [['U'], ['L', 'F', 'R', 'B'], ['D']]

interface Props {
  order: number
  /** 允许在动画进行中排队，保证快速连点不丢失 */
  onMove: (move: Move, token: string) => void
}

export default function MovePad({ order, onMove }: Props) {
  const ranges: Range[] = useMemo(() => {
    if (order === 3) {
      return [
        { label: '外层', depth: 1, wide: 1 },
        { label: '中层', depth: 2, wide: 1 },
      ]
    }
    if (order === 4) {
      return [
        { label: '外层', depth: 1, wide: 1 },
        { label: '第 2 层', depth: 2, wide: 1 },
        { label: '双层宽转', depth: 1, wide: 2 },
      ]
    }
    return [
      { label: '外层', depth: 1, wide: 1 },
      { label: '第 2 层', depth: 2, wide: 1 },
      { label: '第 3 层', depth: 3, wide: 1 },
      { label: '双层', depth: 1, wide: 2 },
      { label: '三层', depth: 1, wide: 3 },
    ]
  }, [order])

  const [rangeIdx, setRangeIdx] = useState(0)
  const [dir, setDir] = useState<Dir>(1)

  useEffect(() => {
    setRangeIdx(0)
  }, [order])

  const range = ranges[Math.min(rangeIdx, ranges.length - 1)]

  const preview = useMemo(() => {
    const m = faceMove(order, 'R', dir, range.depth, range.wide)
    return moveToToken(order, m)
  }, [order, dir, range])

  const fire = (move: Move | null, token?: string) => {
    if (!move) return
    onMove(move, token ?? moveToToken(order, move))
  }

  const faceClick = (face: Face) => {
    fire(faceMove(order, face, dir, range.depth, range.wide))
  }

  return (
    <div className="space-y-4">
      {/* 方向 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-brand-900/70">转动方向</span>
          <span className="text-[11px] text-brand-700/60">点击面按钮即执行</span>
        </div>
        <div className="seg">
          {DIRS.map((d) => (
            <button
              key={d.value}
              className="seg-item"
              data-active={dir === d.value}
              title={d.hint}
              onClick={() => setDir(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 层深 */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-900/70">
          <IconLayers width={14} height={14} />
          <span>转动范围</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ranges.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                i === rangeIdx
                  ? 'bg-brand-600 text-white shadow-[0_3px_10px_rgba(79,70,229,0.3)]'
                  : 'bg-white/70 text-brand-700/80 hover:bg-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 面按钮 */}
      <div className="space-y-2">
        {FACE_LAYOUT.map((row, ri) => (
          <div key={ri} className={`grid gap-2 ${row.length === 1 ? 'grid-cols-4' : 'grid-cols-4'}`}>
            {row.length === 1 ? (
              <>
                <div />
                <FaceButton face={row[0]} order={order} dir={dir} onClick={faceClick} />
                <div />
                {ri === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-brand-50/70 py-1 text-[10px] font-medium text-brand-700/60">
                    <span>当前指令</span>
                    <span className="text-[13px] font-extrabold text-brand-800">{preview}</span>
                  </div>
                ) : (
                  <div />
                )}
              </>
            ) : (
              row.map((f) => (
                <FaceButton key={f} face={f} order={order} dir={dir} onClick={faceClick} />
              ))
            )}
          </div>
        ))}
      </div>

      {/* 中层 / 整体转 */}
      <div className="grid grid-cols-2 gap-3">
        {order % 2 === 1 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-brand-900/60">中层</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['M', 'E', 'S'] as const).map((s) => (
                <button
                  key={s}
                 
                  onClick={() => fire(sliceMove(order, s, dir))}
                  className="face-btn h-9 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={order % 2 === 1 ? '' : 'col-span-2'}>
          <div className="mb-1.5 text-[11px] font-semibold text-brand-900/60">整体转魔方</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['x', 'y', 'z'] as const).map((a) => (
              <button
                key={a}
               
                onClick={() => fire(wholeMove(order, a, dir))}
                className="face-btn h-9 text-sm"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-brand-50/70 p-2.5 text-[11px] leading-relaxed text-brand-800/80">
        <IconInfo width={14} height={14} className="mt-0.5 shrink-0" />
        <span>
          六个面按钮按 <b>U</b> 在上、<b>L F R B</b> 在中、<b>D</b> 在下排列。右上角灰色框会实时显示当前指令，例如{' '}
          <b>{preview}</b>。
        </span>
      </div>
    </div>
  )
}

function FaceButton({
  face,
  dir,

  onClick,
}: {
  face: Face
  order: number
  dir: Dir

  onClick: (f: Face) => void
}) {
  const token = face + (dir === 2 ? '2' : dir === -1 ? "'" : '')
  return (
    <button onClick={() => onClick(face)} className="face-btn cursor-pointer flex-col gap-0.5">
      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: FACE_COLOR[face] }} />
      <span className="text-lg leading-none tracking-tight">{token}</span>
      <span className="text-[10px] font-medium text-brand-700/60">{FACE_CN[face]}面</span>
    </button>
  )
}
