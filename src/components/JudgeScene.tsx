'use client'

import { Suspense, useRef, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

export type AnimState = 'idle' | 'talking' | 'arguing' | 'verdict'

const MODELS = {
  idle:   '/models/stand_idle.glb',
  talkA:  '/models/talking2animated.glb',
  talkB:  '/models/talking3animated.glb',
  argueA: '/models/argue1.glb',
  argueB: '/models/argue2.glb',
}

// Only preload on desktop — mobile has limited memory/WebGL
if (typeof window !== 'undefined' && !/Mobi|Android/i.test(navigator.userAgent)) {
  useGLTF.preload(MODELS.idle)
  useGLTF.preload(MODELS.talkA)
  useGLTF.preload(MODELS.talkB)
  useGLTF.preload(MODELS.argueA)
  useGLTF.preload(MODELS.argueB)
}

function resolveModelPath(state: AnimState, flip: boolean): string {
  switch (state) {
    case 'idle':    return MODELS.idle
    case 'talking': return flip ? MODELS.talkA : MODELS.talkB
    case 'arguing': return flip ? MODELS.argueA : MODELS.argueB
    case 'verdict': return MODELS.argueB
  }
}

const SCALE = 1.35        // Character scale
const FEET_Y = -1.8       // Where feet sit in world space (lower = more of floor visible)

function Judge({ modelPath }: { modelPath: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF(modelPath)
  const { actions, names } = useAnimations(animations, groupRef)

  // Compute bounding box in model space to auto-center the mesh
  const groupPosition = useMemo<[number, number, number]>(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3()
    box.getCenter(center)
    // Shift X so the horizontal center lands at world 0
    // Shift Y so the feet (box.min.y) land at FEET_Y
    return [
      -center.x * SCALE,
      FEET_Y - box.min.y * SCALE,
      -center.z * SCALE,
    ]
  }, [scene])

  useEffect(() => {
    if (!names.length) return
    const action = actions[names[0]]
    if (!action) return
    action.reset().fadeIn(0.3).play()
    return () => { action.fadeOut(0.3) }
  }, [actions, names])

  return (
    <group ref={groupRef} scale={SCALE} position={groupPosition}>
      <primitive object={scene} />
    </group>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 5, 3]} intensity={1.8} />
      <pointLight position={[-3, 3, 2]} intensity={0.5} color="#c8a84b" />
      <pointLight position={[3, 1, -2]} intensity={0.3} color="#3366ff" />
    </>
  )
}

interface Props {
  animState: AnimState
  flip?: boolean
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

export default function JudgeScene({ animState, flip = false }: Props) {
  const modelPath = resolveModelPath(animState, flip)
  const [webgl] = useState(() => typeof window !== 'undefined' && isWebGLAvailable())

  if (!webgl) {
    return <div style={{ width: '100%', height: '100%', background: '#0d0d1a' }} />
  }

  return (
    <Canvas
      camera={{ position: [0, 0.2, 5], fov: 55 }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }}
    >
      <color attach="background" args={['#0d0d1a']} />
      <SceneLights />
      <Suspense fallback={null}>
        <Judge key={modelPath} modelPath={modelPath} />
      </Suspense>
    </Canvas>
  )
}
