import { useEffect, useRef } from 'react'

/**
 * Aceternity-style spotlight: a radial gradient that follows the top of the viewport.
 */
export function Spotlight({ className = '', fill = '#00F0FF' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(600px circle at 50% 0%, ${fill}15, transparent 70%)`,
      }}
    />
  )
}

/**
 * Aceternity-style animated grid pattern with glow nodes.
 */
export function GridPattern({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
      }}
    />
  )
}

/**
 * Animated beam that moves from left to right along a line.
 */
export function AnimatedBeam({ className = '' }) {
  return (
    <div className={`absolute inset-x-0 top-0 h-px overflow-hidden ${className}`}>
      <div
        className="absolute left-0 top-0 h-full w-24 opacity-80"
        style={{
          background: 'linear-gradient(90deg, transparent, #00F0FF, transparent)',
          animation: 'beamMove 4s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes beamMove {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(calc(100vw + 100px)); }
        }
      `}</style>
    </div>
  )
}

/**
 * Animated border card — gradient border that rotates.
 */
export function GlowCard({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div
        className="absolute inset-0 rounded-xl opacity-50"
        style={{
          background: 'conic-gradient(from 0deg, transparent, #00F0FF40, transparent 30%)',
          animation: 'rotate 4s linear infinite',
        }}
      />
      <div className="relative bg-panel rounded-xl m-[1px] p-5">
        {children}
      </div>
      <style>{`
        @keyframes rotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * Digital rain / matrix columns on edges.
 */
export function MatrixEdges({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight

    const chars = '01アイウエオカキクケコサシスセソ'
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops = Array(columns).fill(1)

    let frameId
    const draw = () => {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${fontSize}px JetBrains Mono`

      for (let i = 0; i < drops.length; i++) {
        // Only show at left and right edges
        const x = i * fontSize
        const edgeWidth = 120
        if (x > edgeWidth && x < canvas.width - edgeWidth) continue
        const edgeFade = x < edgeWidth ? (edgeWidth - x) / edgeWidth : (x - canvas.width + edgeWidth) / edgeWidth

        ctx.fillStyle = `rgba(0, 255, 136, ${edgeFade * 0.4})`
        ctx.fillText(
          chars[Math.floor(Math.random() * chars.length)],
          x,
          drops[i] * fontSize
        )
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
      frameId = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none opacity-30 ${className}`}
    />
  )
}
