"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

interface VoiceParticleVisualizerProps {
  isActive?: boolean
  simulatedVolume?: number
}

// Microphone volume hook
function useMicVolume(isActive: boolean, simulatedVolume = 0) {
  const [volume, setVolume] = useState(0)

  useEffect(() => {
    // If we have a simulated volume, use that instead
    if (simulatedVolume > 0) {
      setVolume(simulatedVolume)
      return
    }

    // If not active, reset volume
    if (!isActive) {
      setVolume(0)
      return
    }

    let cleanup: (() => void) | undefined

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

        // Return cleanup function
        cleanup = () => {
          stream.getTracks().forEach((track) => track.stop())
        }
      } catch (err) {
        console.error("Mic access error:", err)
      }
    }

    startMic()

    return () => {
      if (cleanup) cleanup()
    }
  }, [isActive, simulatedVolume])

  return volume
}

// Main particle field
function ParticleField({ isActive, simulatedVolume = 0 }: VoiceParticleVisualizerProps) {
  const ref = useRef<THREE.Points>(null)
  const [sphere] = useState(() => {
    const points = Array.from({ length: 500 }, () => [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ])
    return new Float32Array(points.flat())
  })

  const volume = useMicVolume(isActive || false, simulatedVolume)
  const colors = useRef<Float32Array>()

  useEffect(() => {
    const tempColors = new Float32Array(500 * 3) // RGB per point
    for (let i = 0; i < 500; i++) {
      const distance = Math.sqrt(sphere[i * 3] ** 2 + sphere[i * 3 + 1] ** 2 + sphere[i * 3 + 2] ** 2)
      const t = Math.min(1, distance / 1.5)
      const color = new THREE.Color()
      color.setHSL(0.6 - 0.6 * t, 1.0, 0.5) // Inner = blue, Outer = pink
      color.toArray(tempColors, i * 3)
    }
    colors.current = tempColors
  }, [sphere])

  useFrame((state) => {
    if (ref.current) {
      // Only animate if active
      if (isActive) {
        ref.current.rotation.x += 0.001 + volume / 50000
        ref.current.rotation.y += 0.001 + volume / 50000

        const positions = ref.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < positions.length; i += 3) {
          // add slight twitch based on volume
          if (volume > 20) {
            positions[i] += (Math.random() - 0.5) * (volume / 10000)
            positions[i + 1] += (Math.random() - 0.5) * (volume / 10000)
            positions[i + 2] += (Math.random() - 0.5) * (volume / 10000)
          }
        }
        ref.current.geometry.attributes.position.needsUpdate = true
      }
    }
  })

  return (
    <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.02 + volume / 400} // Pulse bigger with voice
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

export default function VoiceParticleVisualizer3D({
  isActive = true,
  simulatedVolume = 0,
}: VoiceParticleVisualizerProps) {
  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 75 }} style={{ background: "transparent" }}>
        <ParticleField isActive={isActive} simulatedVolume={simulatedVolume} />
      </Canvas>
    </div>
  )
}
