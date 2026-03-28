import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ─── DATA ────────────────────────────────────────────────────

const INITIAL_SLOTS = [
  { id: 1, data: 'Player Position',   status: 'loaded',  required: true,  size: '12KB',  color: '#c9a84c' },
  { id: 2, data: 'Weapon Stats',      status: 'loaded',  required: true,  size: '8KB',   color: '#c9a84c' },
  { id: 3, data: 'Texture Cache',     status: 'loaded',  required: false, size: '48KB',  color: '#94a3b8' },
  { id: 4, data: 'Physics State',     status: 'loaded',  required: true,  size: '22KB',  color: '#c9a84c' },
  { id: 5, data: 'Main Menu Assets',  status: 'loaded',  required: false, size: '64KB',  color: '#94a3b8' },
  { id: 6, data: 'Audio Buffers',     status: 'loaded',  required: true,  size: '18KB',  color: '#c9a84c' },
]

const FETCH_ITEMS = [
  { id: 'eh', data: 'Enemy Health',   size: '6KB',  color: '#a78bfa' },
  { id: 'cm', data: 'Collision Map',  size: '14KB', color: '#a78bfa' },
]

const SIGNAL_PATH = [
  { label: 'House Core',    img: '/images/Castle.png'  },
  { label: 'Grand Hall',    img: '/images/Grand Hall.png' },
]

// ─── TYPEWRITER HOOK ─────────────────────────────────────────

function useTypewriter(text, speed = 28, onDone) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        if (onDone) onDone()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text])
  return displayed
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function HouseVolatile({ onComplete }) {
  const sectionRef = useRef()
  const [phase, setPhase]             = useState('signal')
  const [signalStep, setSignalStep]   = useState(0)
  const [slots, setSlots]             = useState(INITIAL_SLOTS)
  const [fetchQueue, setFetchQueue]   = useState(FETCH_ITEMS)
  const [fetching, setFetching]       = useState(null)
  const [fetchProgress, setFetchProgress] = useState(0)
  const [dismissed, setDismissed]     = useState([])
  const [taskDone, setTaskDone]       = useState(false)

  // ── Start signal travel after typewriter ──
  const startSignalTravel = () => {
    setTimeout(() => {
        let step = 0
        const interval = setInterval(() => {
        step++
        setSignalStep(step)
        if (step >= SIGNAL_PATH.length) {
            clearInterval(interval)
            setTimeout(() => setPhase('brief'), 4000)
        }
        }, 1000)
    }, 7000)
  }

  // ── Dismiss a slot ──
  const handleDismiss = (slotId) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot || slot.required || slot.status === 'empty' || slot.status === 'fetching') return
    setDismissed(prev => [...prev, slotId])
    setSlots(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, status: 'empty', data: null, size: null, color: null, required: false }
        : s
    ))
  }

  // ── Fetch next item from queue ──
  const handleFetch = () => {
    if (fetchQueue.length === 0) return
    const emptySlots = slots.filter(s => s.status === 'empty')
    if (emptySlots.length === 0) return

    const item      = fetchQueue[0]
    const targetSlot = emptySlots[0]

    // Mark slot as fetching
    setSlots(prev => prev.map(s =>
      s.id === targetSlot.id
        ? { ...s, status: 'fetching', data: item.data, color: item.color }
        : s
    ))
    setFetching(item.id)
    setFetchProgress(0)

    // Animate fetch progress
    gsap.to({ val: 0 }, {
      val: 100,
      duration: 1.8,
      ease: 'power1.inOut',
      onUpdate: function () {
        setFetchProgress(Math.round(this.targets()[0].val))
      },
      onComplete: () => {
        // Mark as loaded
        setSlots(prev => prev.map(s =>
          s.id === targetSlot.id
            ? { ...s, status: 'loaded', size: item.size }
            : s
        ))
        setFetchQueue(prev => prev.filter(f => f.id !== item.id))
        setFetching(null)
        setFetchProgress(0)

        // Check if all fetched
        if (fetchQueue.length === 1) {
          setTimeout(() => setTaskDone(true), 600)
        }
      }
    })
  }

  // ── Check if user can fetch ──
  const emptyCount    = slots.filter(s => s.status === 'empty').length
  const neededDismiss = Math.max(0, fetchQueue.length - emptyCount)
  const canFetch      = fetchQueue.length > 0 && emptyCount > 0 && !fetching

  return (
    <div ref={sectionRef} style={s.section}>

      {/* Circuit background */}
      <svg style={s.circuitSvg} width="100%" height="100%">
        {[15, 35, 55, 75].map(y => (
          <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
            stroke="#a78bfa" strokeWidth="0.5" strokeDasharray="8 16" opacity="0.06" />
        ))}
        {[15, 35, 55, 75].map(x => (
          <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
            stroke="#a78bfa" strokeWidth="0.5" strokeDasharray="8 16" opacity="0.06" />
        ))}
      </svg>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.symbol}>⚡</span>
          <div>
            <p style={s.meta}>House Volatile · The Grand Hall</p>
            <h2 style={s.title}>The RAM</h2>
          </div>
        </div>
        <div style={s.badge}>
          <span style={s.badgeLabel}>Frame Budget</span>
          <span style={s.badgeValue}>15.7ms</span>
        </div>
      </div>

      {/* Signal phase */}
      {phase === 'signal' && (
        <SignalTravel
          steps={SIGNAL_PATH}
          currentStep={signalStep}
          onTypewriterDone={startSignalTravel}
        />
      )}

      {/* Brief phase */}
      {phase === 'brief' && (
        <BriefPanel onStart={() => setPhase('task')} />
      )}

      {/* Task phase */}
      {(phase === 'task') && (
        <TaskPanel
          slots={slots}
          fetchQueue={fetchQueue}
          fetching={fetching}
          fetchProgress={fetchProgress}
          neededDismiss={neededDismiss}
          canFetch={canFetch}
          taskDone={taskDone}
          onDismiss={handleDismiss}
          onFetch={handleFetch}
          onComplete={onComplete}
        />
      )}

    </div>
  )
}

// ─── SIGNAL TRAVEL ───────────────────────────────────────────

function SignalTravel({ steps, currentStep, onTypewriterDone }) {
  const fullText = `House Core has executed the ATTACK command. The signal now travels to House Volatile — the Grand Hall must load all required game data into active memory before the frame can be rendered...`
  const [typingDone, setTypingDone] = useState(false)

  const displayed = useTypewriter(fullText, 28, () => {
    setTypingDone(true)
    onTypewriterDone()
  })

  const parts = displayed.split('ATTACK')

  return (
    <div style={s.signalWrap}>
      <p style={s.signalTitle}>Signal Received from House Core</p>
      <p style={s.signalSub}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span style={{ color: '#a78bfa', fontStyle: 'normal', fontWeight: 600 }}>
                ATTACK
              </span>
            )}
          </span>
        ))}
        {!typingDone && (
          <span style={{ animation: 'pulse 0.8s ease-in-out infinite', color: '#a78bfa' }}>|</span>
        )}
      </p>

      {typingDone && (
        <div style={sn.track}>
          {steps.map((step, i) => {
            const isCompleted = i < currentStep
            return (
              <div key={step.label} style={{
                display: 'flex', alignItems: 'center',
                flex: i < steps.length - 1 ? 1 : 0,
              }}>
                <div style={sn.nodeCol}>
                  <div style={{
                    ...sn.circle,
                    borderColor: isCompleted ? '#a78bfa' : 'rgba(167,139,250,0.2)',
                    boxShadow:   isCompleted ? '0 0 16px rgba(167,139,250,0.5)' : 'none',
                    overflow: 'hidden',
                    transition: 'all 0.5s ease',
                  }}>
                    <img src={step.img} alt={step.label} style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      opacity: isCompleted ? 1 : 0.25,
                      filter: isCompleted ? 'none' : 'grayscale(100%)',
                      transition: 'all 0.5s ease',
                    }} />
                  </div>
                  <p style={{
                    ...sn.stepLabel,
                    color: isCompleted ? '#a78bfa' : 'rgba(240,232,208,0.3)',
                    transition: 'color 0.5s ease',
                  }}>
                    {step.label}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ ...sn.connector, flex: 1 }}>
                    <div style={sn.connectorBg} />
                    <div style={{
                      ...sn.connectorFill,
                      width: i < currentStep - 1 ? '100%' : '0%',
                      background: 'linear-gradient(90deg, #a78bfa, #c4b5fd)',
                      transition: 'width 2s ease',
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── BRIEF PANEL ─────────────────────────────────────────────

function BriefPanel({ onStart }) {
  const ref = useRef()
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    )
  }, [])

  return (
    <div ref={ref} style={s.briefPanel}>
      <p style={s.briefScrollLabel}>📜 Royal Decree from House Core</p>
      <h3 style={s.briefTitle}>What is RAM?</h3>
      <div style={s.briefBody}>
        <BriefPoint icon="🏛️" title="The Grand Hall of the Kingdom"
          text="RAM is the active working memory of the computer. Every application, game, and process that is currently running lives in RAM — instantly accessible by the CPU at any moment." />
        <BriefPoint icon="⚡" title="Blazing Fast, But Limited"
          text="RAM is thousands of times faster than storage. But unlike storage, it has limited space — a typical game uses 8–16GB of RAM, and filling it up causes slowdowns." />
        <BriefPoint icon="🌙" title="The Curse — It Forgets at Dusk"
          text="RAM is volatile — the moment power is cut, everything in it vanishes. This is why unsaved work disappears in a crash. It remembers everything, but only while powered." />
        <BriefPoint icon="📋" title="Cache Miss — The Empty Shelf"
          text="When the CPU requests data not in RAM, it must be fetched from storage. This is called a cache miss and it costs precious milliseconds — dangerous when every frame counts." />
      </div>
      <button style={s.startBtn} onClick={onStart}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'rgba(167,139,250,0.15)'
          e.currentTarget.style.borderColor = '#a78bfa'
          e.currentTarget.style.color       = '#c4b5fd'
          e.currentTarget.style.boxShadow   = '0 0 30px rgba(167,139,250,0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
          e.currentTarget.style.color       = 'rgba(167,139,250,0.9)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      >
        ⚡ Manage the Grand Hall →
      </button>
    </div>
  )
}

function BriefPoint({ icon, title, text }) {
  return (
    <div style={s.briefPoint}>
      <span style={s.briefIcon}>{icon}</span>
      <div>
        <p style={s.briefPointTitle}>{title}</p>
        <p style={s.briefPointText}>{text}</p>
      </div>
    </div>
  )
}

// ─── TASK PANEL ──────────────────────────────────────────────

function TaskPanel({
  slots, fetchQueue, fetching, fetchProgress,
  neededDismiss, canFetch, taskDone,
  onDismiss, onFetch, onComplete
}) {
  const ref = useRef()
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )
  }, [])

  return (
    <div ref={ref} style={s.taskPanel}>

      {/* Left — instructions + fetch queue */}
      <div style={s.taskLeft}>
        <p style={s.taskEyebrow}>Grand Hall Management</p>
        <h3 style={s.taskTitle}>Load the Required Data</h3>
        <p style={s.taskDesc}>
          The ATTACK command needs data that is not currently in the Grand Hall.
          <span style={{ color: '#ef4444' }}> Dismiss</span> irrelevant advisors
          to free slots, then <span style={{ color: '#a78bfa' }}> Fetch</span> the missing data from the Vaults.
        </p>

        {/* Status bar */}
        <div style={s.statusBar}>
          <StatusPill
            label="Slots Free"
            value={slots.filter(s => s.status === 'empty').length}
            color="#22c55e"
          />
          <StatusPill
            label="Still Needed"
            value={fetchQueue.length}
            color="#a78bfa"
          />
          <StatusPill
            label="Dismiss More"
            value={neededDismiss}
            color={neededDismiss > 0 ? '#ef4444' : '#22c55e'}
          />
        </div>

        {/* Fetch queue */}
        <div style={s.fetchQueue}>
          <p style={s.fetchQueueLabel}>Required from Vaults:</p>
          {fetchQueue.length === 0 ? (
            <div style={s.fetchDone}>
              <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>
              <span style={{ color: '#22c55e', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                All data loaded
              </span>
            </div>
          ) : (
            fetchQueue.map(item => (
              <div key={item.id} style={{
                ...s.fetchItem,
                borderColor: fetching === item.id
                  ? '#a78bfa'
                  : 'rgba(167,139,250,0.2)',
                background: fetching === item.id
                  ? 'rgba(167,139,250,0.1)'
                  : 'transparent',
              }}>
                <div style={{ ...s.fetchDot, background: item.color }} />
                <span style={s.fetchItemName}>{item.data}</span>
                <span style={s.fetchItemSize}>{item.size}</span>
                {fetching === item.id && (
                  <span style={s.fetchingLabel}>
                    fetching... {fetchProgress}%
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Fetch button */}
        {!taskDone && (
          <button
            style={{
              ...s.fetchBtn,
              opacity: canFetch ? 1 : 0.4,
              cursor: canFetch ? 'pointer' : 'not-allowed',
            }}
            onClick={onFetch}
            disabled={!canFetch}
            onMouseEnter={e => {
              if (!canFetch) return
              e.currentTarget.style.background  = 'rgba(167,139,250,0.15)'
              e.currentTarget.style.borderColor = '#a78bfa'
              e.currentTarget.style.color       = '#c4b5fd'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
              e.currentTarget.style.color       = 'rgba(167,139,250,0.8)'
            }}
          >
            {fetching
              ? `⏳ Fetching from Vaults... ${fetchProgress}%`
              : neededDismiss > 0
              ? `⚠ Dismiss ${neededDismiss} more slot${neededDismiss > 1 ? 's' : ''} first`
              : '⚡ Fetch from Vaults'
            }
          </button>
        )}

        {/* Done panel */}
        {taskDone && <DonePanel onComplete={onComplete} />}

      </div>

      {/* Right — memory slots grid */}
      <div style={s.taskRight}>
        <p style={s.slotsLabel}>Grand Hall — 6 Memory Slots</p>
        <div style={s.slotsGrid}>
          {slots.map(slot => (
            <MemorySlot
              key={slot.id}
              slot={slot}
              onDismiss={onDismiss}
              taskDone={taskDone}
            />
          ))}
        </div>
        <p style={s.slotsHint}>
          Click <span style={{ color: '#ef4444' }}>DISMISS</span> on grey slots to free space
        </p>
      </div>

    </div>
  )
}

// ─── MEMORY SLOT ─────────────────────────────────────────────

function MemorySlot({ slot, onDismiss, taskDone }) {
  const isEmpty    = slot.status === 'empty'
  const isFetching = slot.status === 'fetching'
  const isRequired = slot.required
  const isDismissable = !isEmpty && !isRequired && !isFetching && !taskDone

  const borderColor = isEmpty
    ? 'rgba(255,255,255,0.06)'
    : isFetching
    ? '#a78bfa'
    : isRequired
    ? 'rgba(201,168,76,0.3)'
    : 'rgba(148,163,184,0.25)'

  const bgColor = isEmpty
    ? 'rgba(255,255,255,0.02)'
    : isFetching
    ? 'rgba(167,139,250,0.08)'
    : isRequired
    ? 'rgba(201,168,76,0.05)'
    : 'rgba(148,163,184,0.04)'

  return (
    <div style={{
      ...s.slot,
      borderColor,
      background: bgColor,
      transition: 'all 0.3s ease',
    }}>

      {/* Slot number */}
      <div style={s.slotNum}>
        <span style={s.slotNumLabel}>SLOT</span>
        <span style={{
          ...s.slotNumVal,
          color: isEmpty ? 'rgba(255,255,255,0.15)'
            : isFetching ? '#a78bfa'
            : isRequired  ? '#c9a84c'
            : '#94a3b8',
        }}>
          {slot.id}
        </span>
      </div>

      {/* Status dot */}
      <div style={{
        ...s.slotDot,
        background: isEmpty ? 'rgba(255,255,255,0.1)'
          : isFetching ? '#a78bfa'
          : isRequired  ? '#c9a84c'
          : '#94a3b8',
        boxShadow: isFetching ? '0 0 8px #a78bfa' : 'none',
        animation: isFetching ? 'corePulse 1s ease-in-out infinite' : 'none',
      }} />

      {/* Data name */}
      <p style={{
        ...s.slotData,
        color: isEmpty ? 'rgba(255,255,255,0.12)'
          : isFetching ? '#a78bfa'
          : isRequired  ? 'rgba(201,168,76,0.8)'
          : 'rgba(148,163,184,0.7)',
      }}>
        {isEmpty ? '— EMPTY —' : slot.data}
      </p>

      {/* Size */}
      {slot.size && (
        <p style={s.slotSize}>{slot.size}</p>
      )}

      {/* Required badge */}
      {isRequired && !isEmpty && (
        <span style={s.requiredBadge}>REQUIRED</span>
      )}

      {/* Dismiss button */}
      {isDismissable && (
        <button
          style={s.dismissBtn}
          onClick={() => onDismiss(slot.id)}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(239,68,68,0.15)'
            e.currentTarget.style.borderColor = '#ef4444'
            e.currentTarget.style.color       = '#fca5a5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
            e.currentTarget.style.color       = 'rgba(239,68,68,0.7)'
          }}
        >
          DISMISS
        </button>
      )}

      {/* Fetching progress bar */}
      {isFetching && (
        <div style={s.slotProgress}>
          <div style={{
            ...s.slotProgressFill,
            animation: 'loadingBar 1.8s linear forwards',
          }} />
        </div>
      )}

    </div>
  )
}

function StatusPill({ label, value, color }) {
  return (
    <div style={s.pill}>
      <span style={{ ...s.pillValue, color }}>{value}</span>
      <span style={s.pillLabel}>{label}</span>
    </div>
  )
}

// ─── DONE PANEL ──────────────────────────────────────────────

function DonePanel({ onComplete }) {
  const ref = useRef()

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }
    )
  }, [])

  const handleClick = () => {
    if (onComplete) onComplete()
    
    setTimeout(() => {
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth'
      })
    }, 150)
  }

  return (
    <div ref={ref} style={s.doneBox}>
      <p style={s.doneTitle}>Grand Hall Ready</p>
      <p style={s.doneText}>
        All required data is loaded into active memory. The CPU has everything
        it needs. The signal now travels to{' '}
        <span style={{ color: '#34d399' }}>House Render</span> —
        the Artists must paint the attack frame.
      </p>
      <div style={s.doneMeta}>
        <span style={s.doneMetaItem}>⏱ 1.2ms used</span>
        <span style={s.doneMetaItem}>📦 14.5ms remaining</span>
      </div>
      {onComplete && (
        <button style={s.nextBtn} onClick={handleClick}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(52,211,153,0.15)'
            e.currentTarget.style.borderColor = '#34d399'
            e.currentTarget.style.color       = '#6ee7b7'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'
            e.currentTarget.style.color       = 'rgba(52,211,153,0.9)'
          }}
        >
          Enter House Render →
        </button>
      )}
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────

const s = {
  section: {
    position: 'relative',
    width: '100vw',
    minHeight: '100vh',
    background: '#00000a',
    display: 'flex',
    flexDirection: 'column',
    padding: 'clamp(24px, 5vh, 60px) clamp(20px, 5vw, 80px)',
    gap: 'clamp(20px, 4vh, 40px)',
    overflow: 'hidden',
  },
  circuitSvg: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    flexWrap: 'wrap',
    gap: 16,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  symbol: {
    fontSize: 'clamp(32px, 5vw, 52px)',
    filter: 'drop-shadow(0 0 16px rgba(167,139,250,0.6))',
  },
  meta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 11px)',
    letterSpacing: '0.3em',
    color: 'rgba(167,139,250,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(22px, 4vw, 44px)',
    fontWeight: 700,
    color: '#a78bfa',
    margin: 0,
    letterSpacing: '0.05em',
    textShadow: '0 0 40px rgba(167,139,250,0.3)',
  },
  badge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px',
    border: '0.5px solid rgba(167,139,250,0.3)',
    borderRadius: 4,
    background: 'rgba(167,139,250,0.06)',
  },
  badgeLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.3em',
    color: 'rgba(167,139,250,0.5)',
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(18px, 3vw, 28px)',
    color: '#a78bfa',
    fontWeight: 700,
    letterSpacing: '0.1em',
  },

  // Signal
  signalWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    zIndex: 1,
    padding: 'clamp(16px, 4vh, 40px) 0',
    marginTop: '5vh'
  },
  signalTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '2rem',
    color: '#a78bfa',
    margin: 0,
    textAlign: 'center',
    letterSpacing: '0.05em',
  },
  signalSub: {
    fontFamily: 'var(--font-body)',
    fontSize: '1.2rem',
    color: 'rgba(240,232,208,0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: 0,
    maxWidth: 900,
    lineHeight: 1.7,
  },

// Brief
  briefPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(16px, 3vh, 28px)',
    zIndex: 1,
    maxWidth: 720,
    margin: '0 auto',
    width: '100%',
    opacity: 0,
  },
  briefScroll: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  briefScrollLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.25em',
    color: 'rgba(201,168,76,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  briefTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(18px, 3vw, 30px)',
    color: '#f0e8d0',
    marginBottom: -10,
    letterSpacing: '0.05em',
  },
  briefBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '20px 24px',
    border: '0.5px solid rgba(201,168,76,0.15)',
    borderRadius: 6,
    background: 'rgba(201,168,76,0.03)',
  },
  briefPoint: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  briefIcon: {
    fontSize: 20,
    flexShrink: 0,
    marginTop: 2,
  },
  briefPointTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(14px, 1.5vw, 19px)',
    color: '#c9a84c',
    fontWeight: 600,
    margin: '0 0 4px',
    letterSpacing: '0.02em',
  },
  briefPointText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.3vw, 16px)',
    color: 'rgba(240,232,208,0.6)',
    margin: 0,
    lineHeight: 1.7,
    fontStyle: 'italic',
  },
  startBtn: {
    alignSelf: 'flex-start',
    padding: '14px 36px',
    background: 'transparent',
    border: '1px solid rgba(201,168,76,0.4)',
    borderRadius: 2,
    color: 'rgba(201,168,76,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(10px, 1.1vw, 12px)',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // Task
  taskPanel: {
    display: 'flex',
    gap: 'clamp(20px, 4vw, 48px)',
    zIndex: 1,
    flexWrap: 'wrap',
    marginTop: '5vh'
  },
  taskLeft: {
    flex: '1 1 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  taskRight: {
    flex: '1 1 340px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  taskEyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.3em',
    color: 'rgba(167,139,250,0.45)',
    textTransform: 'uppercase',
    margin: 0,
  },
  taskTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(16px, 2.5vw, 26px)',
    color: '#f0e8d0',
    margin: 0,
    letterSpacing: '0.04em',
  },
  taskDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.4vw, 20px)',
    color: 'rgba(240,232,208,0.6)',
    fontStyle: 'italic',
    lineHeight: 1.7,
    margin: 0,
  },
  statusBar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  pill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 16px',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.02)',
    minWidth: 80,
  },
  pillValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
  },
  pillLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  fetchQueue: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  fetchQueueLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.2em',
    color: 'rgba(167,139,250,0.4)',
    textTransform: 'uppercase',
    margin: 0,
  },
  fetchItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    border: '0.5px solid rgba(167,139,250,0.2)',
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  fetchDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  fetchItemName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(167,139,250,0.8)',
    letterSpacing: '0.1em',
    flex: 1,
  },
  fetchItemSize: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(167,139,250,0.4)',
    letterSpacing: '0.1em',
  },
  fetchingLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#a78bfa',
    letterSpacing: '0.1em',
    animation: 'pulse 1s ease-in-out infinite',
  },
  fetchDone: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    border: '0.5px solid rgba(34,197,94,0.3)',
    borderRadius: 4,
    background: 'rgba(34,197,94,0.05)',
  },
  fetchBtn: {
    padding: '13px 28px',
    background: 'transparent',
    border: '1px solid rgba(167,139,250,0.4)',
    borderRadius: 2,
    color: 'rgba(167,139,250,0.8)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
  },

  // Slots grid
  slotsLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.25em',
    color: 'rgba(167,139,250,0.4)',
    textTransform: 'uppercase',
    margin: 0,
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  slot: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: '10px 12px',
    border: '0.5px solid',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 80,
  },
  slotNum: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  slotNumLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240, 232, 208, 0.36)',
    letterSpacing: '0.2em',
  },
  slotNumVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    transition: 'color 0.3s ease',
  },
  slotDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  slotData: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.08em',
    margin: 0,
    transition: 'color 0.3s ease',
    lineHeight: 1.4,
  },
  slotSize: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.33)',
    marginTop: 3,
    letterSpacing: '0.1em',
  },
  requiredBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.15em',
    color: 'rgba(201,168,76,0.5)',
    marginTop: 4,
  },
  dismissBtn: {
    marginTop: 4,
    padding: '3px 8px',
    background: 'transparent',
    border: '0.5px solid rgba(239,68,68,0.3)',
    borderRadius: 2,
    color: 'rgba(239,68,68,0.7)',
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    letterSpacing: '0.15em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    alignSelf: 'flex-start',
  },
  slotProgress: {
    position: 'absolute',
    bottom: 10,
    left: 5,
    right: 5,
    height: 2,
    background: 'rgba(167,139,250,0.1)',
    overflow: 'hidden',
  },
  slotProgressFill: {
    height: '100%',
    background: '#a78bfa',
    width: '0%',
  },
  slotsHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(251, 251, 251, 0.41)',
    letterSpacing: '0.1em',
    margin: 0,
    textAlign: 'center',
  },

  // Done
  doneBox: {
    padding: '18px 22px',
    border: '0.5px solid rgba(167,139,250,0.3)',
    borderRadius: 4,
    background: 'rgba(167,139,250,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  doneIcon: {
    fontFamily: 'var(--font-mono)',
    fontSize: 22,
    color: '#22c55e',
    margin: 0,
    lineHeight: 1,
  },
  doneTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(14px, 2vw, 20px)',
    color: '#f0e8d0',
    margin: 0,
  },
  doneText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.3vw, 15px)',
    color: 'rgba(240,232,208,0.6)',
    fontStyle: 'italic',
    lineHeight: 1.7,
    margin: 0,
  },
  doneMeta: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  doneMetaItem: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(167,139,250,0.5)',
    letterSpacing: '0.1em',
  },
  nextBtn: {
    alignSelf: 'flex-start',
    padding: '11px 26px',
    background: 'transparent',
    border: '1px solid rgba(52,211,153,0.4)',
    borderRadius: 2,
    color: 'rgba(52,211,153,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 11px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
}

// Signal node styles
const sn = {
  track: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    paddingRight: '2vw',
    marginTop: 30
  },
  nodeCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  circle: {
    width: 'clamp(120px, 15vw, 400px)',     
    height: 'clamp(70px, 20vh, 200px)',    
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  stepLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(12px, 1vw, 12px)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginTop: 7,
    textAlign: 'center',
    maxWidth: 150,
    lineHeight: 1.4,
  },
  connector: {
    position: 'relative',
    height: 2,
    marginBottom: 38,
  },
  connectorBg: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(167,139,250,0.12)',
    borderRadius: 1,
  },
  connectorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 1,
    boxShadow: '0 0 8px rgba(167,139,250,0.5)',
  },
}