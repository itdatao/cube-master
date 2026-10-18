import { useMemo } from 'react'
import type { Formula } from '../data/formulas'
import { tokenize } from '../cube/logic'
import { NotationChips } from './FormulaPanel'
import { IconClose, IconPause, IconPlay, IconSkipBack, IconSkipForward } from './icons'

interface Props {
  formula: Formula
  index: number
  auto: boolean
  onToggle: () => void
  onStepBack: () => void
  onStepForward: () => void
  onClose: () => void
}

export default function PlayerBar({
  formula,
  index,
  auto,
  onToggle,
  onStepBack,
  onStepForward,
  onClose,
}: Props) {
  const total = useMemo(() => tokenize(formula.notation).length, [formula.notation])
  return (
    <div className="pop-in pointer-events-auto w-full rounded-2xl border border-white/80 bg-white/85 px-3 py-2.5 shadow-soft backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-bold text-brand-900">{formula.name}</span>
        <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
          第 {Math.min(index + 1, total)} / {total} 步
        </span>
        <div className="flex-1" />
        <button onClick={onClose} className="btn btn-ghost !px-1.5 !py-1" title="退出演示">
          <IconClose width={14} height={14} />
        </button>
      </div>

      <div className="mb-2.5">
        <NotationChips notation={formula.notation} activeIndex={index} size="md" />
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={onStepBack} className="btn !px-2.5 !py-1.5" title="上一步">
          <IconSkipBack width={15} height={15} />
        </button>
        <button onClick={onToggle} className="btn btn-primary flex-1 !py-1.5" title="播放 / 暂停">
          {auto ? <IconPause width={15} height={15} /> : <IconPlay width={15} height={15} />}
          {auto ? '暂停' : '播放'}
        </button>
        <button onClick={onStepForward} className="btn !px-2.5 !py-1.5" title="下一步">
          <IconSkipForward width={15} height={15} />
        </button>
      </div>
    </div>
  )
}
