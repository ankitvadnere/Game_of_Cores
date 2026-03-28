import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'

// ─── DATA ────────────────────────────────────────────────────

const SIGNAL_PATH = [
  { label: 'Grand Hall',     img: '/images/Grand Hall.png'  },
  { label: 'Artists Quarter',img: '/images/Artist Quarter.png' },
]

const SETTINGS = [
  {
    id: 'shadows',
    label: 'Shadow Quality',
    description: 'Calculates how light casts shadows across surfaces',
    painters: { low: 800, mid: 2400, high: 5200 },
    timeMs:   { low: 0.8, mid: 2.1, high: 4.6 },
  },
  {
    id: 'particles',
    label: 'Particle Effects',
    description: 'Sparks, dust, and attack impact particles',
    painters: { low: 600, mid: 1800, high: 3800 },
    timeMs:   { low: 0.6, mid: 1.6, high: 3.2 },
  },
  {
    id: 'lighting',
    label: 'Dynamic Lighting',
    description: 'Real-time light sources on every surface',
    painters: { low: 1200, mid: 3600, high: 6200 },
    timeMs:   { low: 1.1, mid: 3.2, high: 5.8 },
  },
  {
    id: 'antialiasing',
    label: 'Anti-Aliasing',
    description: 'Smooths jagged edges on geometry',
    painters: { low: 400, mid: 900, high: 1800 },
    timeMs:   { low: 0.3, mid: 0.8, high: 1.6 },
  },
]

const LEVEL_LABELS = ['Low', 'Medium', 'High']
const BUDGET_MS    = 8      // GPU gets 8ms of the 16ms frame budget
const MAX_PAINTERS = 10000

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

// ─── HELPERS ─────────────────────────────────────────────────

function calcTotals(levels) {
  let totalPainters = 0
  let totalMs       = 0
  SETTINGS.forEach(setting => {
    const key = levels[setting.id]  // 0=low 1=mid 2=high
    const lvl = key === 0 ? 'low' : key === 1 ? 'mid' : 'high'
    totalPainters += setting.painters[lvl]
    totalMs       += setting.timeMs[lvl]
  })
  return { totalPainters, totalMs }
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function HouseRender({ onComplete }) {
  const [phase, setPhase]           = useState('signal')
  const [signalStep, setSignalStep] = useState(0)

  // Settings: 0=low 1=mid 2=high
  const [levels, setLevels] = useState({
    shadows:      1,
    particles:    1,
    lighting:     1,
    antialiasing: 1,
  })

  const [rendering,     setRendering]     = useState(false)
  const [renderDone,    setRenderDone]    = useState(false)
  const [renderProgress,setRenderProgress]= useState(0)
  const [pixelsFilled,  setPixelsFilled]  = useState(0)
  const canvasRef = useRef()

  const { totalPainters, totalMs } = calcTotals(levels)
  const isOverBudget = totalMs > BUDGET_MS
  const budgetPct    = Math.min((totalMs / BUDGET_MS) * 100, 100)

  // ── Signal travel ──
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

  // ── Level change ──
  const handleLevel = (settingId, val) => {
    setLevels(prev => ({ ...prev, [settingId]: val }))
  }

  // ── Render frame ──
  const handleRender = () => {
    if (isOverBudget || rendering) return
    setRendering(true)
    setRenderProgress(0)
    setPixelsFilled(0)

    // Animate progress
    gsap.to({ val: 0 }, {
      val: 100,
      duration: totalMs * 0.8 + 0.5,
      ease: 'power1.inOut',
      onUpdate: function () {
        const pct = Math.round(this.targets()[0].val)
        setRenderProgress(pct)
        setPixelsFilled(Math.round((pct / 100) * 2073600)) // 1920x1080
      },
      onComplete: () => {
        setRendering(false)
        setRenderDone(true)
        paintCanvas()
      }
    })
  }

  // ── Paint the preview canvas ──
  const paintCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    canvas.width = 1920
    canvas.height = 1080

    const W = canvas.width
    const H = canvas.height

    const img = new Image()
    img.src = '/images/Game Frame.png'

    img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H)

        const imageData = ctx.getImageData(0, 0, W, H)
        const fullData = imageData.data

        const newImage = ctx.createImageData(W, H)
        const buffer = newImage.data

        const totalPixels = fullData.length / 4

        // ✅ Create shuffled indices
        const indices = Array.from({ length: totalPixels }, (_, i) => i)

        for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
        }

        let pointer = 0
        const chunk = 3000 // 🔥 increase for speed

        const paintChunk = () => {
        for (let i = 0; i < chunk; i++) {
            if (pointer >= indices.length) break

            const pixelIndex = indices[pointer] * 4

            buffer[pixelIndex]     = fullData[pixelIndex]
            buffer[pixelIndex + 1] = fullData[pixelIndex + 1]
            buffer[pixelIndex + 2] = fullData[pixelIndex + 2]
            buffer[pixelIndex + 3] = 255

            pointer++
        }

        ctx.putImageData(newImage, 0, 0)

        if (pointer < indices.length) {
            requestAnimationFrame(paintChunk)
        }
        }

        requestAnimationFrame(paintChunk)
    }

    img.onerror = () => {
        console.error("Image failed to load ❌")
    }

    }, [])

  return (
    <div style={s.section}>

      {/* Circuit background — green tinted */}
      <svg style={s.circuitSvg} width="100%" height="100%">
        {[12, 30, 50, 68, 86].map(y => (
          <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
            stroke="#34d399" strokeWidth="0.5" strokeDasharray="6 14" opacity="0.05" />
        ))}
        {[12, 30, 50, 68, 86].map(x => (
          <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
            stroke="#34d399" strokeWidth="0.5" strokeDasharray="6 14" opacity="0.05" />
        ))}
      </svg>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.symbol}>🎨</span>
          <div>
            <p style={s.meta}>House Render · The Artists Quarter</p>
            <h2 style={s.title}>The GPU</h2>
          </div>
        </div>
        <div style={s.badge}>
          <span style={s.badgeLabel}>Frame Budget</span>
          <span style={s.badgeValue}>14.5ms</span>
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
      {phase === 'task' && (
        <TaskPanel
          levels={levels}
          totalPainters={totalPainters}
          totalMs={totalMs}
          isOverBudget={isOverBudget}
          budgetPct={budgetPct}
          rendering={rendering}
          renderDone={renderDone}
          renderProgress={renderProgress}
          pixelsFilled={pixelsFilled}
          canvasRef={canvasRef}
          onLevel={handleLevel}
          onRender={handleRender}
          onComplete={onComplete}
        />
      )}

    </div>
  )
}

// ─── SIGNAL TRAVEL ───────────────────────────────────────────

function SignalTravel({ steps, currentStep, onTypewriterDone }) {
  const fullText = `House Volatile has loaded all required data into active memory. The ATTACK command now reaches House Render — ten thousand artists must paint the next frame. They have 8 milliseconds. Not a moment more.`
  const [typingDone, setTypingDone] = useState(false)

  const displayed = useTypewriter(fullText, 25, () => {
    setTypingDone(true)
    onTypewriterDone()
  })

  return (
    <div style={s.signalWrap}>
      <p style={s.signalTitle}>Commission Received from House Volatile</p>
      <p style={s.signalSub}>
        {displayed}
        {!typingDone && (
          <span style={{ animation: 'pulse 0.8s ease-in-out infinite', color: '#34d399' }}>|</span>
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
                    borderColor: isCompleted ? '#34d399' : 'rgba(52,211,153,0.2)',
                    boxShadow:   isCompleted ? '0 0 16px rgba(52,211,153,0.5)' : 'none',
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
                    color: isCompleted ? '#34d399' : 'rgba(240,232,208,0.3)',
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
                      background: 'linear-gradient(90deg, #34d399, #6ee7b7)',
                      transition: 'width 0.6s ease',
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
      <p style={s.briefScrollLabel}>📜 Commission from the King</p>
      <h3 style={s.briefTitle}>What is the GPU?</h3>
      <div style={s.briefBody}>
        <BriefPoint icon="🖌️" title="Ten Thousand Painters"
          text="While the CPU has 8–16 powerful cores, the GPU has thousands of tiny shader cores — each one capable of painting a small section of the screen simultaneously. An RTX 4090 has over 16,000 cores." />
        <BriefPoint icon="⚡" title="Parallel Power"
          text="Rendering a frame means calculating the color of 2 million pixels at once. The GPU splits this work across thousands of cores — what would take a CPU seconds takes a GPU milliseconds." />
        <BriefPoint icon="💡" title="Shaders — The Artist's Brushes"
          text="Shader programs tell each core exactly how to paint its pixels — calculating lighting, shadows, reflections, and textures. More complex shaders need more cores and more time." />
        <BriefPoint icon="⏱️" title="The 16ms Budget"
          text="At 60fps, each frame has exactly 16.67ms to complete. The GPU typically gets 8ms of that budget. Exceed it and the frame is late — causing a visible stutter called a frame drop." />
      </div>
      <button style={s.startBtn} onClick={onStart}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'rgba(52,211,153,0.15)'
          e.currentTarget.style.borderColor = '#34d399'
          e.currentTarget.style.color       = '#6ee7b7'
          e.currentTarget.style.boxShadow   = '0 0 30px rgba(52,211,153,0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'
          e.currentTarget.style.color       = 'rgba(52,211,153,0.9)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      >
        🎨 Commission the Frame →
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
  levels, totalPainters, totalMs, isOverBudget,
  budgetPct, rendering, renderDone, renderProgress,
  pixelsFilled, canvasRef, onLevel, onRender, onComplete
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

      {/* Left — controls */}
      <div style={s.taskLeft}>

        <p style={s.taskEyebrow}>Artists Quarter · Frame Commission</p>
        <h3 style={s.taskTitle}>Configure the Frame</h3>
        <p style={s.taskDesc}>
          Adjust each visual effect to balance quality against render time.
          You must stay within the{' '}
          <span style={{ color: '#34d399', fontStyle: 'normal', fontWeight: 600 }}>
            8ms budget
          </span>
          {' '}or the frame will be late and the player will see a stutter.
        </p>

        {/* Settings sliders */}
        <div style={s.settingsPanel}>
          {SETTINGS.map(setting => (
            <SettingRow
              key={setting.id}
              setting={setting}
              value={levels[setting.id]}
              onChange={val => onLevel(setting.id, val)}
              disabled={rendering || renderDone}
            />
          ))}
        </div>

        {/* Render button */}
        {!renderDone && (
          <button
            style={{
              ...s.renderBtn,
              opacity: isOverBudget || rendering ? 0.45 : 1,
              cursor:  isOverBudget || rendering ? 'not-allowed' : 'pointer',
              borderColor: isOverBudget
                ? 'rgba(239,68,68,0.4)'
                : 'rgba(52,211,153,0.4)',
              color: isOverBudget
                ? 'rgba(239,68,68,0.8)'
                : 'rgba(52,211,153,0.9)',
            }}
            onClick={onRender}
            disabled={isOverBudget || rendering}
            onMouseEnter={e => {
              if (isOverBudget || rendering) return
              e.currentTarget.style.background  = 'rgba(52,211,153,0.12)'
              e.currentTarget.style.borderColor = '#34d399'
              e.currentTarget.style.color       = '#6ee7b7'
              e.currentTarget.style.boxShadow   = '0 0 30px rgba(52,211,153,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'transparent'
              e.currentTarget.style.borderColor = isOverBudget
                ? 'rgba(239,68,68,0.4)'
                : 'rgba(52,211,153,0.4)'
              e.currentTarget.style.color       = isOverBudget
                ? 'rgba(239,68,68,0.8)'
                : 'rgba(52,211,153,0.9)'
              e.currentTarget.style.boxShadow   = 'none'
            }}
          >
            {rendering
              ? `⏳ Painting frame... ${renderProgress}%`
              : isOverBudget
              ? '⚠ Over budget — reduce settings'
              : '🎨 Render Frame'
            }
          </button>
        )}

        {/* Done panel */}
        {renderDone && <DonePanel onComplete={onComplete} totalMs={totalMs} />}

      </div>

      {/* Right — canvas preview */}
      <div style={s.taskRight}>

        <p style={s.canvasLabel}>Frame Preview — 1920 × 1080</p>

        {/* Canvas */}
        <div style={s.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={384}
            height={216}
            style={s.canvas}
          />

          {/* Overlay when not rendered */}
          {!rendering && !renderDone && (
            <div style={s.canvasOverlay}>
              <p style={s.canvasOverlayText}>
                Awaiting commission...
              </p>
              <p style={s.canvasOverlaySubtext}>
                Configure settings and click Render Frame
              </p>
            </div>
          )}

          {/* Rendering overlay */}
          {rendering && (
            <div style={s.renderingOverlay}>
              <div style={s.renderScanline} />
              <p style={s.renderingText}>
                {renderProgress}%
              </p>
              <p style={s.renderingSubtext}>
                {pixelsFilled.toLocaleString()} / 2,073,600 pixels
              </p>
            </div>
          )}

          {/* Done checkmark */}
          {renderDone && (
            <div style={s.doneBadge}>
              <span style={{ color: '#34d399', fontSize: 16, fontWeight: 700 }}>✓</span>
              <span style={s.doneBadgeText}>Frame Complete</span>
            </div>
          )}
        </div>

        {/* Painter stats */}
        <div style={s.painterStats}>
          <PainterStat
            label="Painters Deployed"
            value={totalPainters.toLocaleString()}
            max={MAX_PAINTERS}
            current={totalPainters}
            color="#34d399"
          />
          <PainterStat
            label="GPU Time Used"
            value={`${totalMs.toFixed(1)}ms`}
            max={BUDGET_MS}
            current={totalMs}
            color={isOverBudget ? '#ef4444' : '#34d399'}
          />
        </div>

      </div>

    </div>
  )
}

// ─── SETTING ROW ─────────────────────────────────────────────

function SettingRow({ setting, value, onChange, disabled }) {
  const lvl    = value === 0 ? 'low' : value === 1 ? 'mid' : 'high'
  const pCount = setting.painters[lvl]
  const tMs    = setting.timeMs[lvl]

  return (
    <div style={sr.row}>
      <div style={sr.top}>
        <div>
          <p style={sr.label}>{setting.label}</p>
          <p style={sr.desc}>{setting.description}</p>
        </div>
        <div style={sr.rightInfo}>
          <span style={{
            ...sr.levelBadge,
            color: value === 2 ? '#ef4444'
              : value === 1 ? '#f59e0b'
              : '#34d399',
            borderColor: value === 2 ? 'rgba(239,68,68,0.3)'
              : value === 1 ? 'rgba(245,158,11,0.3)'
              : 'rgba(52,211,153,0.3)',
          }}>
            {LEVEL_LABELS[value]}
          </span>
          <span style={sr.timeInfo}>{tMs.toFixed(1)}ms</span>
        </div>
      </div>

      {/* 3-button level selector */}
      <div style={sr.btnRow}>
        {LEVEL_LABELS.map((label, i) => (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onChange(i)}
            style={{
              ...sr.levelBtn,
              background: value === i
                ? i === 2 ? 'rgba(239,68,68,0.15)'
                  : i === 1 ? 'rgba(245,158,11,0.15)'
                  : 'rgba(52,211,153,0.15)'
                : 'transparent',
              borderColor: value === i
                ? i === 2 ? '#ef4444'
                  : i === 1 ? '#f59e0b'
                  : '#34d399'
                : 'rgba(255,255,255,0.08)',
              color: value === i
                ? i === 2 ? '#fca5a5'
                  : i === 1 ? '#fcd34d'
                  : '#6ee7b7'
                : 'rgba(240,232,208,0.3)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {label}
          </button>
        ))}
        <span style={sr.painterCount}>
          {pCount.toLocaleString()} painters
        </span>
      </div>
    </div>
  )
}

// ─── BUDGET METER ────────────────────────────────────────────

function BudgetMeter({ totalMs, totalPainters, budgetPct, isOverBudget }) {
  return (
    <div style={bm.wrap}>
      <div style={bm.row}>
        <p style={bm.label}>Frame Time Budget</p>
        <p style={{
          ...bm.value,
          color: isOverBudget ? '#ef4444' : '#34d399',
        }}>
          {totalMs.toFixed(1)}ms / 8.0ms
        </p>
      </div>

      {/* Budget bar */}
      <div style={bm.track}>
        <div style={{
          ...bm.fill,
          width: `${budgetPct}%`,
          background: isOverBudget
            ? 'linear-gradient(90deg, #ef4444, #fca5a5)'
            : budgetPct > 75
            ? 'linear-gradient(90deg, #f59e0b, #fcd34d)'
            : 'linear-gradient(90deg, #34d399, #6ee7b7)',
          boxShadow: isOverBudget
            ? '0 0 12px rgba(239,68,68,0.5)'
            : '0 0 12px rgba(52,211,153,0.4)',
          transition: 'all 0.3s ease',
        }} />
        {/* Budget line at 100% */}
        <div style={bm.budgetLine} />
      </div>

      {/* Painter count */}
      <div style={bm.row}>
        <p style={bm.subLabel}>
          {totalPainters.toLocaleString()} / {MAX_PAINTERS.toLocaleString()} painters
        </p>
        {isOverBudget && (
          <p style={bm.warning}>
            ⚠ Frame will be late — reduce settings
          </p>
        )}
      </div>

      {/* Painter bar */}
      <div style={bm.track}>
        <div style={{
          ...bm.fill,
          width: `${Math.min((totalPainters / MAX_PAINTERS) * 100, 100)}%`,
          background: 'linear-gradient(90deg, #34d399, #6ee7b7)',
          opacity: 0.4,
        }} />
      </div>
    </div>
  )
}

// ─── PAINTER STAT ────────────────────────────────────────────

function PainterStat({ label, value, max, current, color }) {
  const pct = Math.min((current / max) * 100, 100)
  return (
    <div style={ps.wrap}>
      <div style={ps.row}>
        <span style={ps.label}>{label}</span>
        <span style={{ ...ps.value, color }}>{value}</span>
      </div>
      <div style={ps.track}>
        <div style={{
          ...ps.fill,
          width: `${pct}%`,
          background: color,
          opacity: 0.6,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}

// ─── DONE PANEL ──────────────────────────────────────────────

function DonePanel({ onComplete, totalMs }) {
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
      <p style={s.doneIcon}>✓</p>
      <p style={s.doneTitle}>Frame Painted</p>
      <p style={s.doneText}>
        All {(2073600).toLocaleString()} pixels have been painted. The attack frame is complete.
        The signal now travels to{' '}
        <span style={{ color: '#94a3b8' }}>House Eternal</span>{' '}
        — the Vaults must find and update the enemy's health record.
      </p>
      <div style={s.doneMeta}>
        <span style={s.doneMetaItem}>⏱ {totalMs.toFixed(1)}ms used</span>
        <span style={s.doneMetaItem}>
          📦 {(14.5 - totalMs).toFixed(1)}ms remaining
        </span>
      </div>
      {onComplete && (
        <button style={s.nextBtn} onClick={handleClick}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(148,163,184,0.15)'
            e.currentTarget.style.borderColor = '#94a3b8'
            e.currentTarget.style.color       = '#cbd5e1'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(148,163,184,0.4)'
            e.currentTarget.style.color       = 'rgba(148,163,184,0.9)'
          }}
        >
          Enter House Eternal →
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
    filter: 'drop-shadow(0 0 16px rgba(52,211,153,0.6))',
  },
  meta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 11px)',
    letterSpacing: '0.3em',
    color: 'rgba(52,211,153,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(22px, 4vw, 44px)',
    fontWeight: 700,
    color: '#34d399',
    margin: 0,
    letterSpacing: '0.05em',
    textShadow: '0 0 40px rgba(52,211,153,0.3)',
  },
  badge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px',
    border: '0.5px solid rgba(52,211,153,0.3)',
    borderRadius: 4,
    background: 'rgba(52,211,153,0.06)',
  },
  badgeLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.3em',
    color: 'rgba(52,211,153,0.5)',
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(18px, 3vw, 28px)',
    color: '#34d399',
    fontWeight: 700,
    letterSpacing: '0.1em',
  },
  signalWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    zIndex: 1,
    padding: 'clamp(16px, 4vh, 40px) 0',
  },
  signalTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '2rem',
    color: '#34d399',
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
  briefPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(14px, 3vh, 24px)',
    zIndex: 1,
    maxWidth: 720,
    margin: '0 auto',
    width: '100%',
  },
  briefScrollLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.25em',
    color: 'rgba(52,211,153,0.5)',
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
    gap: 14,
    padding: '18px 22px',
    border: '0.5px solid rgba(52,211,153,0.15)',
    borderRadius: 6,
    background: 'rgba(52,211,153,0.03)',
  },
  briefPoint: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  briefIcon: {
    fontSize: 20,
    flexShrink: 0,
    marginTop: 2,
  },
  briefPointTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.4vw, 19px)',
    color: '#34d399',
    fontWeight: 600,
    margin: '0 0 3px',
  },
  briefPointText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(12px, 1.2vw, 16px)',
    color: 'rgba(240,232,208,0.6)',
    margin: 0,
    lineHeight: 1.7,
    fontStyle: 'italic',
  },
  startBtn: {
    alignSelf: 'flex-start',
    padding: '13px 32px',
    background: 'transparent',
    border: '1px solid rgba(52,211,153,0.4)',
    borderRadius: 2,
    color: 'rgba(52,211,153,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(10px, 1.1vw, 12px)',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  taskPanel: {
    display: 'flex',
    gap: 'clamp(20px, 4vw, 48px)',
    zIndex: 1,
    flexWrap: 'wrap',
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
    gap: 14,
  },
  taskEyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.3em',
    color: 'rgba(52,211,153,0.45)',
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
  settingsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '16px 18px',
    border: '0.5px solid rgba(52,211,153,0.12)',
    borderRadius: 6,
    background: 'rgba(52,211,153,0.02)',
  },
  renderBtn: {
    padding: '14px 32px',
    background: 'transparent',
    border: '1px solid',
    borderRadius: 2,
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(10px, 1.1vw, 12px)',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
  },
  canvasLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.25em',
    color: 'rgba(52,211,153,0.4)',
    textTransform: 'uppercase',
    margin: 0,
  },
  canvasWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    background: '#050a05',
    border: '0.5px solid rgba(52,211,153,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
    imageRendering: 'pixelated',
  },
  canvasOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'rgba(0,0,0,0.7)',
  },
  canvasOverlayText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    color: 'rgba(52,211,153,0.5)',
    letterSpacing: '0.2em',
    margin: 0,
  },
  canvasOverlaySubtext: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(240,232,208,0.2)',
    letterSpacing: '0.1em',
    margin: 0,
  },
  renderingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  },
  renderScanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    background: 'rgba(52,211,153,0.6)',
    animation: 'scanline 1.5s linear infinite',
    boxShadow: '0 0 8px rgba(52,211,153,0.8)',
  },
  renderingText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 28,
    fontWeight: 700,
    color: '#34d399',
    margin: 0,
    textShadow: '0 0 20px rgba(52,211,153,0.8)',
  },
  renderingSubtext: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(52,211,153,0.6)',
    letterSpacing: '0.1em',
    margin: 0,
  },
  doneBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.7)',
    border: '0.5px solid rgba(52,211,153,0.4)',
    borderRadius: 2,
  },
  doneBadgeText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: '#34d399',
    letterSpacing: '0.1em',
  },
  painterStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  doneBox: {
    padding: '18px 22px',
    border: '0.5px solid rgba(52,211,153,0.3)',
    borderRadius: 4,
    background: 'rgba(52,211,153,0.04)',
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
    fontSize: 12,
    color: 'rgba(52,211,153,0.5)',
    letterSpacing: '0.1em',
  },
  nextBtn: {
    alignSelf: 'flex-start',
    padding: '11px 26px',
    background: 'transparent',
    border: '1px solid rgba(148,163,184,0.4)',
    borderRadius: 2,
    color: 'rgba(148,163,184,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
}

// Setting row styles
const sr = {
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    paddingBottom: 10,
    borderBottom: '0.5px solid rgba(52,211,153,0.08)',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 16,
    color: 'rgba(240,232,208,0.7)',
    letterSpacing: '0.1em',
    margin: 0,
  },
  desc: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'rgba(240,232,208,0.3)',
    fontStyle: 'italic',
    margin: 0,
    lineHeight: 1.4,
  },
  rightInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
  },
  levelBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.15em',
    padding: '2px 7px',
    border: '0.5px solid',
    borderRadius: 2,
    textTransform: 'uppercase',
  },
  timeInfo: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.1em',
    marginTop: 10
  },
  btnRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  levelBtn: {
    padding: '4px 12px',
    border: '0.5px solid',
    borderRadius: 2,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    transition: 'all 0.2s ease',
  },
  painterCount: {
    marginLeft: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.25)',
    letterSpacing: '0.1em',
  },
}

// Budget meter styles
const bm = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '14px 16px',
    border: '0.5px solid rgba(52,211,153,0.15)',
    borderRadius: 4,
    background: 'rgba(52,211,153,0.02)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.4)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    margin: 0,
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    margin: 0,
    transition: 'color 0.3s ease',
  },
  track: {
    position: 'relative',
    height: 6,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 3,
  },
  budgetLine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 2,
    height: '100%',
    background: 'rgba(255,255,255,0.2)',
  },
  subLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.1em',
    margin: 0,
  },
  warning: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: '#ef4444',
    letterSpacing: '0.1em',
    margin: 0,
    animation: 'pulse 1s ease-in-out infinite',
  },
}

// Painter stat styles
const ps = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.35)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    transition: 'color 0.3s ease',
  },
  track: {
    height: 4,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
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
    background: 'rgba(52,211,153,0.12)',
    borderRadius: 1,
  },
  connectorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 1,
    boxShadow: '0 0 8px rgba(52,211,153,0.5)',
  },
}