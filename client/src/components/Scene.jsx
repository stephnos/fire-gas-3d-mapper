import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'

const COVERAGE_BY_TYPE = {
  fire: 6,
  gas: 8,
}

/**
 * Renders an animated detector marker with alarm indication.
 * @param {{ detector: {id:string,type:'fire'|'gas',x:number,y:number,z:number,alarm:boolean} }} props
 * @returns {JSX.Element}
 */
function DetectorNode({ detector }) {
  const markerRef = useRef(null)

  useFrame(({ clock }) => {
    if (!markerRef.current) return
    const pulse = detector.alarm ? 0.45 + Math.sin(clock.getElapsedTime() * 8) * 0.25 : 0.15
    markerRef.current.material.emissiveIntensity = Math.max(pulse, 0.05)
  })

  const baseColor = detector.type === 'fire' ? '#ef4444' : '#0ea5e9'
  const color = detector.alarm ? '#facc15' : baseColor

  return (
    <group position={[detector.x, detector.y + 0.25, detector.z]}>
      <mesh ref={markerRef} castShadow>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}

/**
 * Coverage zone geometry for a detector.
 * @param {{ detector: {id:string,type:'fire'|'gas',x:number,y:number,z:number} }} props
 * @returns {JSX.Element}
 */
function CoverageZone({ detector }) {
  const radius = COVERAGE_BY_TYPE[detector.type]
  const color = detector.type === 'fire' ? '#ef4444' : '#38bdf8'

  return (
    <mesh position={[detector.x, detector.y + 0.15, detector.z]}>
      <sphereGeometry args={[radius, 28, 28]} />
      <meshStandardMaterial color={color} transparent opacity={0.2} depthWrite={false} />
    </mesh>
  )
}

/**
 * Hazard marker rendered for each streamed backend coordinate.
 * @param {{ hazard: {id:string,type:'fire'|'gas',x:number,y:number,z:number} }} props
 * @returns {JSX.Element}
 */
function HazardNode({ hazard }) {
  const color = hazard.type === 'fire' ? '#f97316' : '#67e8f9'

  return (
    <mesh position={[hazard.x, hazard.y + 0.2, hazard.z]}>
      <sphereGeometry args={[0.18, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
    </mesh>
  )
}

/**
 * Industrial scene primitives that receive pointer intersections.
 * @param {{ onSurfaceClick: (point: {x:number,y:number,z:number}) => void }} props
 * @returns {JSX.Element}
 */
function Environment({ onSurfaceClick }) {
  /**
   * Handles pointer intersections on placeable meshes.
   * @param {import('@react-three/fiber').ThreeEvent<PointerEvent>} event
   */
  const handlePointerDown = (event) => {
    event.stopPropagation()
    const { x, y, z } = event.point
    onSurfaceClick({ x, y, z })
  }

  return (
    <>
      <Grid args={[48, 48]} cellSize={1} sectionSize={4} fadeDistance={48} fadeStrength={1.4} />

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#111827" roughness={0.95} metalness={0.12} />
      </mesh>

      <mesh castShadow receiveShadow position={[4, 1.25, -6]} onPointerDown={handlePointerDown}>
        <boxGeometry args={[4, 2.5, 4]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      <mesh castShadow receiveShadow position={[-7, 0.9, 4]} onPointerDown={handlePointerDown}>
        <boxGeometry args={[3, 1.8, 6]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
    </>
  )
}

/**
 * Scene container with camera, controls, detectors, coverage, and hazards.
 * @param {{
 * detectors:Array<{id:string,type:'fire'|'gas',x:number,y:number,z:number,alarm:boolean}>,
 * hazards:Array<{id:string,type:'fire'|'gas',x:number,y:number,z:number}>,
 * showCoverage:boolean,
 * onSurfaceClick:(point:{x:number,y:number,z:number})=>void
 * }} props
 * @returns {JSX.Element}
 */
export default function Scene({ detectors, hazards, showCoverage, onSurfaceClick }) {
  const cameraPosition = useMemo(() => [16, 14, 16], [])

  return (
    <Canvas shadows camera={{ position: cameraPosition, fov: 50 }}>
      <color attach="background" args={['#020617']} />

      <ambientLight intensity={0.45} />
      <directionalLight
        intensity={1.2}
        position={[12, 16, 4]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Environment onSurfaceClick={onSurfaceClick} />

      {showCoverage && detectors.map((detector) => <CoverageZone key={`cov-${detector.id}`} detector={detector} />)}

      {detectors.map((detector) => (
        <DetectorNode key={detector.id} detector={detector} />
      ))}

      {hazards.map((hazard) => (
        <HazardNode key={hazard.id} hazard={hazard} />
      ))}

      <OrbitControls makeDefault />
    </Canvas>
  )
}
