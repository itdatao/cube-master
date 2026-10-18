import { type MutableRefObject, useEffect, useRef, useState } from 'react'
import { type EngineOptions, CubeEngine } from '../cube/engine'

/** 创建并维护 Three.js 魔方引擎实例 */
export function useCubeEngine(order: number, optsRef: MutableRefObject<EngineOptions>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<CubeEngine | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const engine = new CubeEngine(el, order, {
      onMoveStart: (token, i) => optsRef.current.onMoveStart?.(token, i),
      onMoveEnd: () => optsRef.current.onMoveEnd?.(),
      onIdle: () => optsRef.current.onIdle?.(),
    })
    engineRef.current = engine
    setReady(true)

    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(el)
    const onWinResize = () => engine.resize()
    window.addEventListener('resize', onWinResize)

    return () => {
      window.removeEventListener('resize', onWinResize)
      ro.disconnect()
      engine.dispose()
      engineRef.current = null
      setReady(false)
    }
    // 仅在挂载时创建；order 变化由下方 effect 处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    engineRef.current?.setOrder(order)
  }, [order])

  return { containerRef, engineRef, ready }
}
