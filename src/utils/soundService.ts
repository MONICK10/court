// Pure JS Audio API — no library needed.
// Files go in /public/sounds/
//
// Browser autoplay policy: audio.play() is blocked until the user has
// clicked/tapped anywhere on the page. Call unlockAudio() on the first
// user gesture (we wire this in CourtroomLayout via onClick on the wrapper).

export type SoundName = 'gavel' | 'tension' | 'typing' | 'objection' | 'winner' | 'ambience'

const DEFAULT_VOLUMES: Record<SoundName, number> = {
  gavel:     0.7,
  tension:   0.5,
  typing:    0.15,
  objection: 0.8,
  winner:    0.65,
  ambience:  0.06,
}

const LOOP_SOUNDS: SoundName[] = ['ambience', 'typing']

const pool: Partial<Record<SoundName, HTMLAudioElement>> = {}
let _muted    = false
let _unlocked = false          // becomes true after first user gesture
let _wantAmbience = false      // remembers if ambience was requested before unlock

function get(name: SoundName): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!pool[name]) {
    const a = new Audio(`/sounds/${name}.mp3`)
    a.preload = 'auto'
    a.volume  = DEFAULT_VOLUMES[name]
    a.loop    = LOOP_SOUNDS.includes(name)
    pool[name] = a
  }
  return pool[name]!
}

// Sounds queued before unlock — played immediately after first gesture
const _pendingQueue: SoundName[] = []

// ─── Call this on the very first user click anywhere ─────────────────
export function unlockAudio(): void {
  if (_unlocked || typeof window === 'undefined') return
  _unlocked = true

  // Resume any AudioContext that browsers suspended (mobile browsers)
  const ctx = (window as Window & { _ac?: AudioContext })._ac
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})

  // Flush any sounds that were blocked before first gesture
  if (!_muted) {
    _pendingQueue.forEach(name => playSound(name))
  }
  _pendingQueue.length = 0

  // If ambience was requested before unlock, start it now
  if (_wantAmbience && !_muted) {
    const a = get('ambience')
    if (a && a.paused) a.play().catch(() => {})
  }
}

export function playSound(name: SoundName): void {
  if (_muted) return
  if (!_unlocked) {
    // Queue it — will fire once user clicks anything
    if (!_pendingQueue.includes(name)) _pendingQueue.push(name)
    return
  }
  const a = get(name)
  if (!a) return
  if (!LOOP_SOUNDS.includes(name)) a.currentTime = 0
  a.play().catch(() => {})
}

export function stopSound(name: SoundName): void {
  const a = pool[name]
  if (!a) return
  a.pause()
  a.currentTime = 0
}

export function setVolume(name: SoundName, level: number): void {
  const a = get(name)
  if (a) a.volume = Math.max(0, Math.min(1, level))
}

export function setMuted(muted: boolean): void {
  _muted = muted
  if (muted) {
    Object.values(pool).forEach(a => a?.pause())
  } else {
    // Restore ambience if it was wanted
    if (_wantAmbience && _unlocked) {
      const a = pool['ambience']
      if (a && a.paused) a.play().catch(() => {})
    }
  }
}

export function startAmbience(): void {
  _wantAmbience = true
  if (_muted || !_unlocked) return   // will auto-start when unlockAudio() is called
  const a = get('ambience')
  if (a && a.paused) a.play().catch(() => {})
}

export function stopAmbience(): void {
  _wantAmbience = false
  stopSound('ambience')
}

export function startTyping(): void {
  if (_muted || !_unlocked) return
  const a = get('typing')
  if (a && a.paused) a.play().catch(() => {})
}

export function stopTyping(): void {
  stopSound('typing')
}
