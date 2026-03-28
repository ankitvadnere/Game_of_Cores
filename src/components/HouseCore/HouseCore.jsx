import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─── DATA ────────────────────────────────────────────────────

const CORES = [
  { id: 1, task: 'OS Background',   status: 'busy',  color: '#ef4444' },
  { id: 2, task: 'Audio Engine',    status: 'busy',  color: '#ef4444' },
  { id: 3, task: null,              status: 'free',  color: '#22c55e' },
  { id: 4, task: 'Physics Engine',  status: 'busy',  color: '#ef4444' },
  { id: 5, task: null,              status: 'free',  color: '#22c55e' },
  { id: 6, task: 'Network Monitor', status: 'busy',  color: '#ef4444' },
  { id: 7, task: null,              status: 'free',  color: '#22c55e' },
  { id: 8, task: 'Shader Compile',  status: 'busy',  color: '#ef4444' },
]

const SIGNAL_PATH = [
  { label: 'Kingdom Gates', img: '/images/Kingdom_gates.png'  },
  { label: 'Throne Room',   img: '/images/Castle.png' },
]

// ─── MAIN COMPONENT ──────────────────────────────────────────

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

export default function HouseCore({ onComplete }) {
  const sectionRef    = useRef()
  const signalRef     = useRef()
  const [phase, setPhase]               = useState('intro')
  // phases: intro → signal → brief → task → processing → done
  const [cores, setCores]               = useState(CORES)
  const [dragOver, setDragOver]         = useState(null)
  const [assignedCore, setAssignedCore] = useState(null)
  const [progress, setProgress]         = useState(0)
  const [sntep, setsntep]     = useState(0)

  // ── Scroll trigger to start the scene ──
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 20%',
      once: true,
      onEnter: () => {
        // Animate section in
        gsap.fromTo(sectionRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1, ease: 'power2.out',
            onComplete: () => startSignalAnimation()
          }
        )
      }
    })
    return () => trigger.kill()
  }, [])

  // ── Signal traveling animation ──
  const startSignalAnimation = () => {
    setPhase('signal')
    setTimeout(() => {
      let step = 0
      const interval = setInterval(() => {
          step++
          setsntep(step)
          if (step >= SIGNAL_PATH.length) {
          clearInterval(interval)
          setTimeout(() => setPhase('brief'), 4000)
          }
      }, 1000)
    }, 7000)
    }

  // ── After user reads brief, show task ──
  const handleStartTask = () => setPhase('task')

  // ── Drag handlers ──
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', 'attack')
  }

  const handleDragOver = (e, coreId) => {
    e.preventDefault()
    setDragOver(coreId)
  }

  const handleDragLeave = () => setDragOver(null)

  const handleDrop = (e, core) => {
    e.preventDefault()
    setDragOver(null)
    if (core.status !== 'free') return
    assignTask(core.id)
  }

  // ── Also allow click to assign on mobile ──
  const handleCoreClick = (core) => {
    if (phase !== 'task') return
    if (core.status !== 'free') return
    assignTask(core.id)
  }

  // ── Assign and process ──
  const assignTask = (coreId) => {
    setAssignedCore(coreId)
    setCores(prev => prev.map(c =>
      c.id === coreId
        ? { ...c, status: 'assigned', task: 'ATTACK CMD', color: '#c9a84c' }
        : c
    ))
    setPhase('processing')

    // Animate progress bar
    gsap.to({ val: 0 }, {
      val: 100,
      duration: 2.5,
      ease: 'power1.inOut',
      onUpdate: function() {
        setProgress(Math.round(this.targets()[0].val))
      },
      onComplete: () => {
        setTimeout(() => setPhase('done'), 400)
      }
    })
  }

  return (
    <div ref={sectionRef} style={s.section}>

      {/* ── Background circuit lines ── */}
      <CircuitBackground />

      {/* ── Top house header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.houseSymbol}>⚙</span>
          <div>
            <p style={s.houseMeta}>House Core · The Throne Room</p>
            <h2 style={s.houseTitle}>The CPU</h2>
          </div>
        </div>
        <div style={s.timerBadge}>
          <span style={s.timerLabel}>Frame Budget</span>
          <span style={s.timerValue}>16ms</span>
        </div>
      </div>

      {/* ── Signal phase ── */}
      {phase === 'signal' && (
        <SignalTravel
          steps={SIGNAL_PATH}
          currentStep={sntep}
        />
      )}

      {/* ── Brief phase ── */}
      {phase === 'brief' && (
        <BriefPanel onStart={handleStartTask} />
      )}

      {/* ── Task phase ── */}
      {(phase === 'task' || phase === 'processing' || phase === 'done') && (
        <TaskPanel
          cores={cores}
          phase={phase}
          assignedCore={assignedCore}
          progress={progress}
          dragOver={dragOver}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onCoreClick={handleCoreClick}
          onComplete={onComplete}
        />
      )}

    </div>
  )
}

// ─── CIRCUIT BACKGROUND ──────────────────────────────────────

function CircuitBackground() {
  return (
    <div style={s.circuitBg} aria-hidden>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
        {/* Horizontal lines */}
        {[10, 25, 40, 55, 70, 85].map(y => (
          <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
            stroke="#c9a84c" strokeWidth="0.5" strokeDasharray="8 12" />
        ))}
        {/* Vertical lines */}
        {[10, 25, 40, 55, 70, 85].map(x => (
          <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
            stroke="#c9a84c" strokeWidth="0.5" strokeDasharray="8 12" />
        ))}
        {/* Corner nodes */}
        {[[10,10],[25,25],[40,55],[55,40],[70,70],[85,25],[25,70],[70,40]].map(([x,y],i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r="2.5"
            fill="#c9a84c" opacity="0.6" />
        ))}
      </svg>
    </div>
  )
}

// ─── SIGNAL TRAVEL ───────────────────────────────────────────

function SignalTravel({ steps, currentStep, onTypewriterDone }) {
  const fullText = `The player is playing a sword combat game and has pressed the button. The signal of that attack button is going towards the House Core (CPU)...`

  const [typingDone, setTypingDone] = useState(false)

  const displayed = useTypewriter(fullText, 40, () => {
    setTypingDone(true)
    onTypewriterDone()   // fires after typing finishes
  })
  return (
    <div style={s.signalWrap}>
      <p style={s.signalTitle}>
        Incoming Command Detected
      </p>
      <p style={s.snub}>
        {displayed}
        {!typingDone && (
          <span style={{ animation: 'pulse 0.8s ease-in-out infinite', color: '#c9a84c' }}>
            |
          </span>
        )}
      </p>

      {/* Progress bar track */}
      <div style={sn.track}>
        {steps.map((step, i) => {
            const isCompleted = i < currentStep
            const isActive    = i === currentStep - 1

            return (
            <div key={step} style={{
                display: 'flex',
                alignItems: 'center',
                flex: i < steps.length - 1 ? 1 : 0,  // last node doesn't flex
            }}>

                {/* Node */}
                <div style={sn.nodeCol}>
                <div style={{
                  ...sn.circle,
                  borderColor: isCompleted ? '#c9a84c' : 'rgba(201,168,76,0.2)',
                  boxShadow:   isActive
                    ? '0 0 20px rgba(201,168,76,0.6)'
                    : isCompleted
                    ? '0 0 12px rgba(201,168,76,0.3)'
                    : 'none',
                  overflow: 'hidden',
                  transition: 'all 0.5s ease',
                }}>
                  <img
                    src={step.img}
                    alt={step.label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: isCompleted ? 1 : 0.3,
                      transition: 'opacity 0.5s ease',
                      filter: isCompleted
                        ? 'none'
                        : 'grayscale(100%)',
                    }}
                  />
                </div>
                <p style={{
                    ...sn.stepLabel,
                    color: isCompleted ? '#c9a84c' : 'rgba(240,232,208,0.3)',
                    transition: 'color 0.5s ease',
                }}>
                    {step.label}
                </p>
                </div>

                {/* Connector AFTER node, only if not last */}
                {i < steps.length - 1 && (
                <div style={{
                    ...sn.connectorWrapper,
                    flex: 1,
                }}>
                    <div style={sn.connectorBg} />
                    <div style={{
                    ...sn.connectorFill,
                    width: i < currentStep - 1 ? '100%' : '0%',
                    transition: 'width 2s ease',
                    }} />
                </div>
                )}

            </div>
            )
        })}
        </div>
    </div>
  )
}

// ─── BRIEF PANEL ─────────────────────────────────────────────

function BriefPanel({ onStart }) {
  const panelRef = useRef()

  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    )
  }, [])

  return (
    <div ref={panelRef} style={s.briefPanel}>

      <div style={s.briefScroll}>
        <p style={s.briefScrollLabel}>📜 Royal Decree</p>
      </div>

      <h3 style={s.briefTitle}>What is the CPU?</h3>

      <div style={s.briefBody}>
        <BriefPoint
          icon="👑"
          title="The King of the Kingdom"
          text="The CPU is the brain of the computer. Every single instruction — moving a character, playing a sound, rendering a pixel — begins with a command from the CPU."
        />
        <BriefPoint
          icon="⚙️"
          title="Cores are the King's Princes"
          text="Modern CPUs have multiple cores — each core can handle one task simultaneously. An 8-core CPU can run 8 tasks at the exact same time."
        />
        <BriefPoint
          icon="⚡"
          title="Speed is Everything"
          text="A 3.5GHz CPU executes 3.5 billion instructions per second. When you press a button in a game, the CPU processes it in under a millisecond."
        />
        <BriefPoint
          icon="📋"
          title="Scheduling — The King's Dilemma"
          text="At any moment, many tasks compete for core time. The CPU must decide — which task runs on which core, and in what order. This is called scheduling."
        />
      </div>

      <button
        style={s.startBtn}
        onClick={onStart}
        onMouseEnter={e => {
          e.currentTarget.style.background   = 'rgba(201,168,76,0.2)'
          e.currentTarget.style.borderColor  = '#c9a84c'
          e.currentTarget.style.color        = '#f0c040'
          e.currentTarget.style.boxShadow    = '0 0 30px rgba(201,168,76,0.25)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background   = 'transparent'
          e.currentTarget.style.borderColor  = 'rgba(201,168,76,0.4)'
          e.currentTarget.style.color        = 'rgba(201,168,76,0.9)'
          e.currentTarget.style.boxShadow    = 'none'
        }}
      >
        ⚔ Assign the Command →
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
  cores, phase, assignedCore, progress,
  dragOver, onDragStart, onDragOver,
  onDragLeave, onDrop, onCoreClick, onComplete
}) {
  const panelRef = useRef()

  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )
  }, [])

  const freeCores  = cores.filter(c => c.status === 'free').length
  const busyCores  = cores.filter(c => c.status === 'busy').length

  return (
    <div ref={panelRef} style={s.taskPanel}>

      {/* Left — Command card + instructions */}
      <div style={s.taskLeft}>

        <p style={s.taskEyebrow}>Mission Briefing</p>
        <h3 style={s.taskTitle}>Assign the Attack Command</h3>
        <p style={s.taskDesc}>
          The game player pressed <span style={s.highlight}>ATTACK</span>.
          The command has arrived at the Throne Room.
          Drag it onto a <span style={{ color: '#22c55e' }}>free core</span> to execute it.
        </p>

        {/* Core stats */}
        <div style={s.coreStats}>
          <div style={s.coreStat}>
            <span style={{ ...s.coreStatDot, background: '#ef4444' }} />
            <span style={s.coreStatText}>{busyCores} Busy</span>
          </div>
          <div style={s.coreStat}>
            <span style={{ ...s.coreStatDot, background: '#22c55e' }} />
            <span style={s.coreStatText}>{freeCores} Free</span>
          </div>
          <div style={s.coreStat}>
            <span style={{ ...s.coreStatDot, background: '#c9a84c' }} />
            <span style={s.coreStatText}>
              {assignedCore ? '1 Assigned' : '0 Assigned'}
            </span>
          </div>
        </div>

        {/* Command card — draggable */}
        {phase === 'task' && (
          <div
            draggable
            onDragStart={onDragStart}
            style={s.commandCard}
          >
            <div style={s.commandCardInner}>
              <span style={s.commandIcon}>⚔</span>
              <div>
                <p style={s.commandName}>ATTACK</p>
                <p style={s.commandMeta}>Priority: HIGH · Size: 2KB</p>
              </div>
              <span style={s.commandDrag}>⠿ drag</span>
            </div>
            <p style={s.commandHint}>
              Drag onto a free core — or tap a green core
            </p>
          </div>
        )}

        {/* Processing state */}
        {phase === 'processing' && (
          <div style={s.processingBox}>
            <p style={s.processingLabel}>
              Core {assignedCore} executing ATTACK...
            </p>
            <div style={s.progressTrack}>
              <div style={{
                ...s.progressFill,
                width: `${progress}%`,
              }} />
            </div>
            <div style={s.progressRow}>
              <span style={s.progressPct}>{progress}%</span>
              <span style={s.progressStage}>
                {progress < 30  ? 'Fetching instruction...'  :
                 progress < 60  ? 'Decoding operands...'     :
                 progress < 85  ? 'Executing logic...'       :
                                  'Writing result...'}
              </span>
            </div>
          </div>
        )}

        {/* Done state */}
        {phase === 'done' && (
          <DonePanel onComplete={onComplete} />
        )}

      </div>

      {/* Right — 8 cores grid */}
      <div style={s.taskRight}>
        <p style={s.coresLabel}>CPU Cores — 8 Core Processor</p>
        <div style={s.coresGrid}>
          {cores.map(core => (
            <CoreSlot
              key={core.id}
              core={core}
              phase={phase}
              isDragOver={dragOver === core.id}
              isAssigned={assignedCore === core.id}
              progress={progress}
              onDragOver={e => onDragOver(e, core.id)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, core)}
              onClick={() => onCoreClick(core)}
            />
          ))}
        </div>
        <p style={s.coresHint}>
          {phase === 'task'
            ? '↑ Drop the command card onto any green core'
            : phase === 'processing'
            ? `Core ${assignedCore} is executing the command`
            : phase === 'done'
            ? '✓ Command executed successfully'
            : ''}
        </p>
      </div>

    </div>
  )
}

// ─── CORE SLOT ───────────────────────────────────────────────

function CoreSlot({
  core, phase, isDragOver, isAssigned,
  progress, onDragOver, onDragLeave, onDrop, onClick
}) {
  const isFree       = core.status === 'free'
  const isAssigning  = core.status === 'assigned'
  const isClickable  = phase === 'task' && isFree

  const borderColor = isAssigned
    ? '#c9a84c'
    : isDragOver && isFree
    ? '#22c55e'
    : isFree
    ? 'rgba(34,197,94,0.35)'
    : 'rgba(239,68,68,0.25)'

  const bgColor = isAssigned
    ? 'rgba(201,168,76,0.1)'
    : isDragOver && isFree
    ? 'rgba(34,197,94,0.15)'
    : isFree
    ? 'rgba(34,197,94,0.05)'
    : 'rgba(239,68,68,0.05)'

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      style={{
        ...s.coreSlot,
        borderColor,
        background: bgColor,
        cursor:     isClickable ? 'pointer' : 'default',
        transform:  isDragOver && isFree ? 'scale(1.04)' : 'scale(1)',
        boxShadow:  isAssigned
          ? '0 0 20px rgba(201,168,76,0.2)'
          : isDragOver && isFree
          ? '0 0 16px rgba(34,197,94,0.2)'
          : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Core number */}
      <div style={s.coreNumber}>
        <span style={s.coreNumLabel}>CORE</span>
        <span style={{
          ...s.coreNumVal,
          color: isAssigned ? '#c9a84c' : isFree ? '#22c55e' : '#ef4444',
        }}>
          {core.id}
        </span>
      </div>

      {/* Status indicator */}
      <div style={{
        ...s.coreIndicator,
        background: isAssigned ? '#c9a84c' : isFree ? '#22c55e' : '#ef4444',
        boxShadow:  `0 0 8px ${isAssigned ? '#c9a84c' : isFree ? '#22c55e' : '#ef4444'}`,
        animation:  isFree ? 'corePulse 2s ease-in-out infinite' : 'none',
      }} />

      {/* Task label */}
      <p style={{
        ...s.coreTask,
        color: isAssigned
          ? '#c9a84c'
          : isFree
          ? 'rgba(34,197,94,0.6)'
          : 'rgba(240,232,208,0.4)',
      }}>
        {isAssigned ? '⚔ ATTACK' : core.task || '— FREE —'}
      </p>

      {/* Mini progress for assigned core */}
      {isAssigned && (
        <div style={s.coreMiniProgress}>
          <div style={{
            ...s.coreMiniProgressFill,
            width: `${progress}%`,
          }} />
        </div>
      )}

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
      <p style={s.doneTitle}>Command Executed</p>
      <p style={s.doneText}>
        The ATTACK instruction has been processed. The CPU now sends
        the game logic to <span style={{ color: '#a78bfa' }}>House Volatile</span> —
        the Grand Hall must load the game world into memory.
      </p>
      <div style={s.doneMeta}>
        <span style={s.doneMetaItem}>⏱ 0.3ms used</span>
        <span style={s.doneMetaItem}>📦 15.7ms remaining</span>
      </div>
      {onComplete && (
        <button
          style={s.nextBtn}
          onClick={handleClick}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(167,139,250,0.2)'
            e.currentTarget.style.borderColor = '#a78bfa'
            e.currentTarget.style.color       = '#c4b5fd'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
            e.currentTarget.style.color       = 'rgba(167,139,250,0.9)'
          }}
        >
          Enter House Volatile →
        </button>
      )}
    </div>
  )
}

// ─── s ──────────────────────────────────────────────────

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
    opacity: 0  
  },
  circuitBg: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },

  // Header
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
  houseSymbol: {
    fontSize: 'clamp(32px, 5vw, 52px)',
    filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.5))',
  },
  houseMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 11px)',
    letterSpacing: '0.3em',
    color: 'rgba(201,168,76,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  houseTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(22px, 4vw, 44px)',
    fontWeight: 700,
    color: '#c9a84c',
    margin: 0,
    letterSpacing: '0.05em',
    textShadow: '0 0 40px rgba(201,168,76,0.3)',
  },
  timerBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px',
    border: '0.5px solid rgba(201,168,76,0.3)',
    borderRadius: 4,
    background: 'rgba(201,168,76,0.06)',
  },
  timerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.3em',
    color: 'rgba(201,168,76,0.5)',
    textTransform: 'uppercase',
  },
  timerValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(18px, 3vw, 28px)',
    color: '#c9a84c',
    fontWeight: 700,
    letterSpacing: '0.1em',
  },

  //Signal
  signalWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100vw',
    height: '30vh',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: '10vw',
    marginTop: '10vh'
  },

  signalTitle: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '2rem',
    fontFamily: 'var(--font-title)',
    color: 'rgb(255, 183, 1)',
  },

  snub: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1.2rem',
    marginTop: 5,
    color: 'rgba(240,232,208,0.6)'
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

  // Task panel
  taskPanel: {
    display: 'flex',
    gap: 'clamp(20px, 4vw, 48px)',
    zIndex: 1,
    flexWrap: 'wrap',
    opacity: 0,
    marginTop: '12vh'
  },
  taskLeft: {
    flex: '1 1 340px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
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
    color: 'rgba(201,168,76,0.45)',
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
  highlight: {
    color: '#c9a84c',
    fontStyle: 'normal',
    fontWeight: 600,
    margin: '0 5px'
  },
  coreStats: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  coreStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  coreStatDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  coreStatText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'rgba(240,232,208,0.5)',
    letterSpacing: '0.1em',
  },

  // Command card
  commandCard: {
    padding: '16px 20px',
    border: '1px solid rgba(201,168,76,0.5)',
    borderRadius: 4,
    background: 'rgba(201,168,76,0.08)',
    cursor: 'grab',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'all 0.2s ease',
    marginTop: 10,
    height: '16vh',
    paddingTop: 25
  },
  commandCardInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  commandIcon: {
    fontSize: 30,
    flexShrink: 0,
    marginTop: '-5px'
  },
  commandName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(14px, 1.8vw, 18px)',
    color: '#c9a84c',
    fontWeight: 700,
    letterSpacing: '0.2em',
    margin: 0,
  },
  commandMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(201,168,76,0.5)',
    letterSpacing: '0.15em',
    marginTop: 5,
  },
  commandDrag: {
    marginLeft: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(201,168,76,0.4)',
    letterSpacing: '0.1em',
  },
  commandHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    marginTop: 9,
    color: 'rgba(201,168,76,0.35)',
    letterSpacing: '0.1em',
    textAlign: 'center',
  },

  // Processing
  processingBox: {
    padding: '16px 20px',
    border: '0.5px solid rgba(201,168,76,0.3)',
    borderRadius: 4,
    background: 'rgba(201,168,76,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  processingLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'rgba(201,168,76,0.7)',
    letterSpacing: '0.15em',
    margin: 0,
  },
  progressTrack: {
    height: 6,
    background: 'rgba(201,168,76,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #c9a84c, #f0c040)',
    borderRadius: 3,
    transition: 'width 0.1s linear',
    boxShadow: '0 0 8px rgba(201,168,76,0.5)',
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPct: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#c9a84c',
    letterSpacing: '0.1em',
  },
  progressStage: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'rgba(201,168,76,0.45)',
    letterSpacing: '0.1em',
  },

  // Done
  doneBox: {
    padding: '20px 24px',
    border: '0.5px solid rgba(201,168,76,0.3)',
    borderRadius: 4,
    background: 'rgba(201,168,76,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    opacity: 0,
  },
  doneTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(14px, 2vw, 20px)',
    color: '#f0e8d0',
    margin: 0,
  },
  doneText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.3vw, 16px)',
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
    fontSize: 13,
    color: 'rgba(201,168,76,0.5)',
    letterSpacing: '0.1em',
  },
  nextBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    padding: '12px 28px',
    background: 'transparent',
    border: '1px solid rgba(167,139,250,0.4)',
    borderRadius: 2,
    color: 'rgba(167,139,250,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 11px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // Cores grid
  coresLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    letterSpacing: '0.25em',
    color: 'rgba(201,168,76,0.4)',
    textTransform: 'uppercase',
    margin: 0,
  },
  coresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  coreSlot: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '12px 14px',
    border: '0.5px solid',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  coreNumber: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 5,
  },
  coreNumLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.25)',
    letterSpacing: '0.2em',
  },
  coreNumVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: '0.05em',
    transition: 'color 0.3s ease',
  },
  coreIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  coreTask: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.1em',
    margin: 0,
    transition: 'color 0.3s ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  coreMiniProgress: {
    height: 3,
    background: 'rgba(201,168,76,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  coreMiniProgressFill: {
    height: '100%',
    background: '#c9a84c',
    borderRadius: 2,
    transition: 'width 0.1s linear',
  },
  coresHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.12em',
    margin: 0,
    textAlign: 'center',
  },
}

const sn = {
  track: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    paddingRight: '2vw',
    marginTop: 30
  },
  stepWrapper: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  connectorWrapper: {
    flex: 1,
    position: 'relative',
    height: 2,
    marginBottom: 15,
  },
  connectorBg: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(201,168,76,0.12)',
    borderRadius: 1,
  },
  connectorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #c9a84c, #f0c040)',
    borderRadius: 1,
    boxShadow: '0 0 8px rgba(201,168,76,0.5)',
  },
  nodeCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flexShrink: 0,
  },
  circle: {
    width: 200,     
    height: 150,    
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  checkmark: {
    color: '#c9a84c',
    fontSize: 16,
    fontWeight: 700,
  },
  stepNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    color: 'rgba(201,168,76,0.3)',
    fontWeight: 700,
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
}