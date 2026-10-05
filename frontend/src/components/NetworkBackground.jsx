import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Animated 3D network of interconnected nodes.
 * Represents a campus network — perfect for SYNAPSE's cybersecurity aesthetic.
 */
export default function NetworkBackground({ className = '' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0A0E17, 0.08)

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.z = 12

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ======= NODES =======
    const NODE_COUNT = 80
    const nodes = []
    const nodePositions = []

    const nodeGeo = new THREE.SphereGeometry(0.08, 12, 12)
    const nodeMatCyan = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.9 })
    const nodeMatMatrix = new THREE.MeshBasicMaterial({ color: 0x00FF88, transparent: true, opacity: 0.9 })

    for (let i = 0; i < NODE_COUNT; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10
      )
      const mesh = new THREE.Mesh(
        nodeGeo,
        i % 7 === 0 ? nodeMatMatrix : nodeMatCyan
      )
      mesh.position.copy(pos)
      scene.add(mesh)

      // Random velocity for drift
      mesh.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      )
      mesh.userData.pulse = Math.random() * Math.PI * 2

      nodes.push(mesh)
      nodePositions.push(pos)
    }

    // ======= CONNECTIONS (LINES) =======
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00F0FF,
      transparent: true,
      opacity: 0.15,
    })

    const lineGeo = new THREE.BufferGeometry()
    const linePositions = new Float32Array(NODE_COUNT * NODE_COUNT * 6)
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    scene.add(lines)

    // ======= DATA PACKETS (TRAVELING LIGHTS) =======
    const PACKET_COUNT = 15
    const packets = []
    const packetGeo = new THREE.SphereGeometry(0.12, 8, 8)
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x00FF88, transparent: true, opacity: 1 })

    for (let i = 0; i < PACKET_COUNT; i++) {
      const packet = new THREE.Mesh(packetGeo, packetMat.clone())
      const from = Math.floor(Math.random() * NODE_COUNT)
      let to = Math.floor(Math.random() * NODE_COUNT)
      while (to === from) to = Math.floor(Math.random() * NODE_COUNT)

      packet.userData = {
        from,
        to,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005
      }
      scene.add(packet)
      packets.push(packet)
    }

    // ======= ANIMATION LOOP =======
    const MAX_CONNECTION_DIST = 3.5
    let frameId
    const clock = new THREE.Clock()

    const animate = () => {
      const t = clock.getElapsedTime()

      // Update nodes
      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i]
        n.position.add(n.userData.velocity)

        // Wrap around bounds
        if (Math.abs(n.position.x) > 12) n.userData.velocity.x *= -1
        if (Math.abs(n.position.y) > 7) n.userData.velocity.y *= -1
        if (Math.abs(n.position.z) > 6) n.userData.velocity.z *= -1

        // Pulse
        const scale = 1 + Math.sin(t * 2 + n.userData.pulse) * 0.3
        n.scale.setScalar(scale)
      }

      // Update connections
      let lineIndex = 0
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dist = nodes[i].position.distanceTo(nodes[j].position)
          if (dist < MAX_CONNECTION_DIST) {
            linePositions[lineIndex++] = nodes[i].position.x
            linePositions[lineIndex++] = nodes[i].position.y
            linePositions[lineIndex++] = nodes[i].position.z
            linePositions[lineIndex++] = nodes[j].position.x
            linePositions[lineIndex++] = nodes[j].position.y
            linePositions[lineIndex++] = nodes[j].position.z
          }
        }
      }
      // Zero out rest
      for (let k = lineIndex; k < linePositions.length; k++) linePositions[k] = 0
      lineGeo.attributes.position.needsUpdate = true
      lineGeo.setDrawRange(0, lineIndex / 3)

      // Update packets
      for (const p of packets) {
        p.userData.progress += p.userData.speed
        if (p.userData.progress >= 1) {
          p.userData.progress = 0
          p.userData.from = p.userData.to
          let next = Math.floor(Math.random() * NODE_COUNT)
          while (next === p.userData.from) next = Math.floor(Math.random() * NODE_COUNT)
          p.userData.to = next
        }
        const from = nodes[p.userData.from].position
        const to = nodes[p.userData.to].position
        p.position.lerpVectors(from, to, p.userData.progress)
      }

      // Gentle camera orbit
      camera.position.x = Math.sin(t * 0.1) * 2
      camera.position.y = Math.cos(t * 0.15) * 1.5
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    // Resize
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      nodeGeo.dispose()
      nodeMatCyan.dispose()
      nodeMatMatrix.dispose()
      lineGeo.dispose()
      lineMat.dispose()
      packetGeo.dispose()
      packetMat.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.4 }}
    />
  )
}
