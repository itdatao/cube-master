import { useState } from 'react'
import type { Curriculum, Formula } from '../data/formulas'
import { tokenize } from '../cube/logic'
import { IconChevron, IconPlay, IconSparkles, IconTarget } from './icons'

const TOKEN_STYLE: Record<string, string> = {
  R: 'bg-red-50 text-red-700 ring-red-100',
  L: 'bg-orange-50 text-orange-700 ring-orange-100',
  U: 'bg-slate-100 text-slate-700 ring-slate-200',
  D: 'bg-amber-50 text-amber-700 ring-amber-100',
  F: 'bg-green-50 text-green-700 ring-green-100',
  B: 'bg-blue-50 text-blue-700 ring-blue-100',
  M: 'bg-brand-50 text-brand-700 ring-brand-100',
  E: 'bg-brand-50 text-brand-700 ring-brand-100',
  S: 'bg-brand-50 text-brand-700 ring-brand-100',
  x: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100',
  y: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100',
  z: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100',
}

function tokenStyle(token: string): string {
  const letter = token.replace(/^[0-9]/, '').replace(/w$/, '')[0]?.toUpperCase() ?? ''
  return TOKEN_STYLE[letter] ?? 'bg-brand-50 text-brand-700 ring-brand-100'
}

export function NotationChips({
  notation,
  activeIndex = -1,
  size = 'sm',
}: {
  notation: string
  activeIndex?: number
  size?: 'sm' | 'md'
}) {
  const tokens = tokenize(notation)
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((t, i) => (
        <span
          key={i}
          className={`chip ring-1 ${tokenStyle(t)} ${
            size === 'md' ? 'min-w-[26px] px-1.5 py-1 text-sm' : 'min-w-[22px] px-1 text-[11px]'
          } ${i === activeIndex ? 'scale-110 shadow-[0_4px_12px_rgba(79,70,229,0.28)] ring-2 ring-brand-400' : ''}`}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

interface Props {
  curriculum: Curriculum
  activeId: string | null
  onPlay: (f: Formula, fromSolved: boolean) => void
}

export default function FormulaPanel({ curriculum, activeId, onPlay }: Props) {
  const [open, setOpen] = useState<string>(curriculum.stages[0]?.id ?? '')

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-brand-50/70 p-3 text-[12px] leading-relaxed text-brand-800/85">
        {curriculum.intro}
      </div>

      {curriculum.stages.map((stage) => {
        const isOpen = open === stage.id
        return (
          <div key={stage.id} className="overflow-hidden rounded-2xl border border-white/70 bg-white/60">
            <button
              onClick={() => setOpen(isOpen ? '' : stage.id)}
              className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-3 text-left transition-colors duration-200 hover:bg-white/80"
            >
              <IconChevron
                width={16}
                height={16}
                className={`shrink-0 text-brand-600 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
              />
              <span className="flex-1 text-[13px] font-bold text-brand-900">{stage.title}</span>
              <span className="rounded-md bg-brand-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                {stage.formulas.length}
              </span>
            </button>

            {isOpen && (
              <div className="pop-in space-y-2.5 px-3.5 pb-3.5">
                <p className="flex gap-1.5 text-[11.5px] leading-relaxed text-brand-700/80">
                  <IconTarget width={14} height={14} className="mt-0.5 shrink-0 text-brand-500" />
                  <span>{stage.goal}</span>
                </p>

                {stage.formulas.map((f) => (
                  <div
                    key={f.id}
                    className={`rounded-xl border p-3 transition-all duration-200 ${
                      activeId === f.id
                        ? 'border-brand-300 bg-brand-50/80 shadow-[0_4px_14px_rgba(79,70,229,0.16)]'
                        : 'border-white/80 bg-white/80 hover:border-brand-200'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-[13px] font-bold text-brand-900">{f.name}</span>
                      {activeId === f.id && (
                        <span className="flex items-center gap-1 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          <IconSparkles width={10} height={10} />
                          演示中
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <NotationChips notation={f.notation} />
                    </div>

                    <p className="mb-2.5 text-[11.5px] leading-relaxed text-brand-700/80">{f.desc}</p>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onPlay(f, true)}
                        className="btn btn-primary flex-1 !px-2 !py-1.5 !text-[12px]"
                      >
                        <IconPlay width={13} height={13} />
                        从复原态演示
                      </button>
                      <button onClick={() => onPlay(f, false)} className="btn btn-ghost !px-2.5 !py-1.5 !text-[12px]">
                        当前状态执行
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
