"use client"

import { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  angle: number
  distance: number
  speed: number
  size: number
  opacity: number
}

interface VoiceParticleVisualizerProps {
  isActive?: boolean
  simulatedVolume?: number
}

export default function VoiceParticleVisualizer({
  isActive = true,
  simulatedVolume = 0,
}: VoiceParticleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [volume, setVolume] = useState(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    // Use simulated volume if provided, otherwise try to get real microphone input
    if (simulatedVolume > 0) {
      setVolume(simulatedVolume)
    } else if (isActive) {
      startMic()
    } else {
      setVolume(0)
    }

    return () => {
      // Clean up any microphone resources if needed
    }
  }, [isActive, simulatedVolume])

  async function startMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)

      const updateVolume = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length
        setVolume(avg)
        if (isActive) {
          requestAnimationFrame(updateVolume)
        }
      }

      updateVolume()

      return () => {
        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch (err) {
      console.error("Mic access error:", err)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Dynamic sizing
    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener("resize", resize)

    // Particle setup
    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      angle: Math.random() * 2 * Math.PI,
      distance: 30 + Math.random() * 40,
      speed: 0.002 + Math.random() * 0.002,
      size: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.4,
      x: 0,
      y: 0,
    }))

    const animate = () => {
      if (!ctx || !isActive) return

      const width = canvas.width / (window.devicePixelRatio || 1)
      const height = canvas.height / (window.devicePixelRatio || 1)
      const centerX = width / 2
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.angle += p.speed + Math.max(0.001, volume / 10000)

        p.x = centerX + Math.cos(p.angle) * p.distance
        p.y = centerY + Math.sin(p.angle) * p.distance

        // Wrap around if leaving bounds
        if (p.x < 0) p.x += width
        if (p.x > width) p.x -= width
        if (p.y < 0) p.y += height
        if (p.y > height) p.y -= height

        const dynamicSize = p.size + volume / 300
        const dynamicOpacity = Math.min(1, p.opacity + volume / 300)

        ctx.beginPath()
        ctx.arc(p.x, p.y, dynamicSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59, 130, 246, ${dynamicOpacity})` // Theme color (blue-500)
        ctx.shadowBlur = 12
        ctx.shadowColor = `rgba(59, 130, 246, 0.8)`
        ctx.fill()
      })

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    if (isActive) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      window.removeEventListener("resize", resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [volume, isActive])

  return (
    <div ref={containerRef} className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
    </div>
  )
}
