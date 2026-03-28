import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'

// ─── DATA ────────────────────────────────────────────────────

const SIGNAL_PATH = [
  { label: 'Artists Quarter', img: '/images/Artist Quarter.png' },
  { label: 'The Vaults',      img: '/images/Vault.png'         },
]

// Three vault chambers the user searches through
const VAULT_CHAMBERS = [
  {
    id: 'cache',
    name: 'Fast Cache',
    type: 'L3 Cache',
    icon: '⚡',
    color: '#f59e0b',
    speed: '0.1ms',
    capacity: '32MB',
    desc: 'Ultra-fast memory built directly into the CPU chip',
    records: [
      { key: 'player_position',   value: 'x:142, y:88',    hot: true  },
      { key: 'current_weapon',    value: 'iron_sword',      hot: true  },
      { key: 'frame_counter',     value: '18472',           hot: true  },
    ],
  },
  {
    id: 'ssd',
    name: 'Crystal Vaults',
    type: 'NVMe SSD',
    icon: '💎',
    color: '#94a3b8',
    speed: '0.05ms',
    capacity: '1TB',
    desc: 'Lightning-fast solid state storage — no moving parts',
    records: [
      { key: 'enemy_health_player2', value: '847',          hot: false },
      { key: 'collision_map_zone3',  value: 'grid_ref_A7',  hot: false },
      { key: 'game_save_slot1',      value: 'checkpoint_4', hot: false },
      { key: 'audio_manifest',       value: 'v2.3.1',       hot: false },
      { key: 'shader_cache',         value: 'compiled_dx12',hot: false },
    ],
  },
  {
    id: 'hdd',
    name: 'Stone Archives',
    type: 'HDD',
    icon: '🗄',
    color: '#64748b',
    speed: '8ms',
    capacity: '4TB',
    desc: 'Spinning magnetic platters — vast but slow',
    records: [
      { key: 'install_manifest',     value: 'v1.0.0',       hot: false },
      { key: 'cutscene_video_01',    value: '2.3GB',         hot: false },
      { key: 'world_geometry_raw',   value: '840MB',         hot: false },
    ],
  },
]

const TARGET_KEY    = 'enemy_health_player2'
const ATTACK_DAMAGE = 230
const INITIAL_HP    = 847

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

export default function HouseEternal({ onComplete }) {
  const [phase, setPhase]           = useState('signal')
  const [signalStep, setSignalStep] = useState(0)

  // Search state
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searching,     setSearching]     = useState(false)
  const [searchPhase,   setSearchPhase]   = useState(null)
  // null → 'cache' → 'cache_miss' → 'ssd' → 'found'
  const [searchLog,     setSearchLog]     = useState([])
  const [foundRecord,   setFoundRecord]   = useState(null)

  // Write state
  const [writing,       setWriting]       = useState(false)
  const [writeDone,     setWriteDone]     = useState(false)
  const [writeProgress, setWriteProgress] = useState(0)
  const [newHp,         setNewHp]         = useState(null)

  const logRef = useRef()

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

  // ── Auto scroll log ──
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [searchLog])

  // ── Search handler ──
  const handleSearch = () => {
    if (searching || !searchQuery.trim()) return
    setSearching(true)
    setSearchLog([])
    setFoundRecord(null)
    setSearchPhase(null)

    const addLog = (msg, color = 'rgba(240,232,208,0.5)') => {
      setSearchLog(prev => [...prev, { msg, color, id: Date.now() + Math.random() }])
    }

    // Phase 1 — Check L3 Cache
    setTimeout(() => {
      setSearchPhase('cache')
      addLog('> Searching L3 Cache...', '#f59e0b')
    }, 300)

    setTimeout(() => {
      addLog(`> Key "${searchQuery}" not found in cache`, '#ef4444')
      addLog('> Cache MISS — escalating to SSD...', 'rgba(240,232,208,0.3)')
      setSearchPhase('cache_miss')
    }, 1000)

    // Phase 2 — Search SSD
    setTimeout(() => {
      setSearchPhase('ssd')
      addLog('> Scanning Crystal Vaults (NVMe SSD)...', '#94a3b8')
      addLog('> Reading sector map...', 'rgba(240,232,208,0.3)')
    }, 1800)

    setTimeout(() => {
      const ssdRecord = VAULT_CHAMBERS[1].records.find(
        r => r.key === searchQuery.trim()
      )

      if (ssdRecord) {
        addLog(`> Found: ${ssdRecord.key}`, '#22c55e')
        addLog(`> Value: ${ssdRecord.value}`, '#94a3b8')
        addLog('> Read complete — 0.05ms', '#22c55e')
        setFoundRecord(ssdRecord)
        setSearchPhase('found')
      } else {
        addLog(`> Key "${searchQuery}" not found in any vault`, '#ef4444')
        addLog('> Search failed', '#ef4444')
        setSearchPhase('not_found')
      }
      setSearching(false)
    }, 3000)
  }

  // ── Write handler ──
  const handleWrite = () => {
    if (writing || writeDone || !foundRecord) return
    const calculated = INITIAL_HP - ATTACK_DAMAGE
    setNewHp(calculated)
    setWriting(true)
    setWriteProgress(0)

    gsap.to({ val: 0 }, {
      val: 100,
      duration: 1.5,
      ease: 'power1.inOut',
      onUpdate: function () {
        setWriteProgress(Math.round(this.targets()[0].val))
      },
      onComplete: () => {
        setWriting(false)
        setWriteDone(true)
      }
    })
  }

  // ── Use correct search query ──
  const handleUseKey = () => {
    setSearchQuery(TARGET_KEY)
  }

  return (
    <div style={s.section}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.symbol}>🗄</span>
          <div>
            <p style={s.meta}>House Eternal · The Underground Vaults</p>
            <h2 style={s.title}>The Storage</h2>
          </div>
        </div>
        <div style={s.badge}>
          <span style={s.badgeLabel}>Frame Budget</span>
          <span style={s.badgeValue}>~6ms</span>
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
          searchQuery={searchQuery}
          searching={searching}
          searchPhase={searchPhase}
          searchLog={searchLog}
          foundRecord={foundRecord}
          writing={writing}
          writeDone={writeDone}
          writeProgress={writeProgress}
          newHp={newHp}
          logRef={logRef}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          onUseKey={handleUseKey}
          onWrite={handleWrite}
          onComplete={onComplete}
        />
      )}

    </div>
  )
}

// ─── SIGNAL TRAVEL ───────────────────────────────────────────

function SignalTravel({ steps, currentStep, onTypewriterDone }) {
  const fullText = `The attack frame has been painted. But what is the enemy's remaining health? This data lives deep in the Vaults. House Eternal must find the scroll, calculate the damage, and write the new value back — before the frame is sent.`
  const [typingDone, setTypingDone] = useState(false)

  const displayed = useTypewriter(fullText, 25, () => {
    setTypingDone(true)
    onTypewriterDone()
  })

  return (
    <div style={s.signalWrap}>
      <p style={s.signalTitle}>Search Request from House Render</p>
      <p style={s.signalSub}>
        {displayed}
        {!typingDone && (
          <span style={{ animation: 'pulse 0.8s ease-in-out infinite', color: '#94a3b8' }}>|</span>
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
                    borderColor: isCompleted ? '#94a3b8' : 'rgba(148,163,184,0.2)',
                    boxShadow:   isCompleted ? '0 0 16px rgba(148,163,184,0.4)' : 'none',
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
                    color: isCompleted ? '#94a3b8' : 'rgba(240,232,208,0.3)',
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
                      background: 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
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
      <p style={s.briefScrollLabel}>📜 Ancient Record — House Eternal</p>
      <h3 style={s.briefTitle}>What is Storage?</h3>
      <div style={s.briefBody}>
        <BriefPoint icon="🗄️" title="The Memory That Never Dies"
          text="Unlike RAM which forgets everything when power is lost, storage remembers forever. Your games, saves, files — all written to storage, surviving every shutdown, every crash." />
        <BriefPoint icon="⚡" title="Three Chambers of the Vault"
          text="Modern systems have three storage tiers — L3 Cache (tiny, ultra-fast, inside the CPU), NVMe SSD (fast, large), and HDD (slow, massive). Data is searched from fastest to slowest." />
        <BriefPoint icon="🔍" title="The Cache Miss"
          text="When data isn't in the fast cache, the system must look deeper. Each tier takes longer to search. A cache miss to HDD can cost 8ms — half the entire frame budget." />
        <BriefPoint icon="✏️" title="Read vs Write"
          text="Reading data is fast. Writing is slower — the storage must find the right location, erase the old value, and commit the new one. During this time, nothing else can use that record." />
      </div>
      <button style={s.startBtn} onClick={onStart}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'rgba(148,163,184,0.15)'
          e.currentTarget.style.borderColor = '#94a3b8'
          e.currentTarget.style.color       = '#cbd5e1'
          e.currentTarget.style.boxShadow   = '0 0 30px rgba(148,163,184,0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(148,163,184,0.4)'
          e.currentTarget.style.color       = 'rgba(148,163,184,0.9)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      >
        🔍 Search the Vaults →
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
  searchQuery, searching, searchPhase, searchLog,
  foundRecord, writing, writeDone, writeProgress,
  newHp, logRef, onSearchChange, onSearch,
  onUseKey, onWrite, onComplete
}) {
  const ref = useRef()
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )
  }, [])

  const canSearch  = !searching && searchQuery.trim().length > 0
  const canWrite   = foundRecord && !writing && !writeDone

  return (
    <div ref={ref} style={s.taskPanel}>

      {/* Left — search interface */}
      <div style={s.taskLeft}>

        <p style={s.taskEyebrow}>Underground Vaults · Record Search</p>
        <h3 style={s.taskTitle}>Find the Enemy's Health Record</h3>
        <p style={s.taskDesc}>
          The attack has landed. Search the vaults for{' '}
          <span
            style={s.keyHint}
            onClick={onUseKey}
            title="Click to use this key"
          >
            enemy_health_player2
          </span>
          {' '}— calculate the damage, then write the new value back.
        </p>

        {/* Search box */}
        <div style={s.searchBox}>
          <p style={s.searchLabel}>{'>'} Vault Search Query</p>
          <div style={s.searchRow}>
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSearch && onSearch()}
              placeholder="enter record key..."
              style={s.searchInput}
              spellCheck={false}
              disabled={searching || writeDone}
            />
            <button
              style={{
                ...s.searchBtn,
                opacity: canSearch ? 1 : 0.4,
                cursor:  canSearch ? 'pointer' : 'not-allowed',
              }}
              onClick={onSearch}
              disabled={!canSearch}
              onMouseEnter={e => {
                if (!canSearch) return
                e.currentTarget.style.background  = 'rgba(148,163,184,0.15)'
                e.currentTarget.style.borderColor = '#94a3b8'
                e.currentTarget.style.color       = '#cbd5e1'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.35)'
                e.currentTarget.style.color       = 'rgba(148,163,184,0.8)'
              }}
            >
              {searching ? '...' : 'SEARCH'}
            </button>
          </div>
          <p style={s.searchHint}>
            Tip: Click the key name above to auto-fill
          </p>
        </div>

        {/* Search log terminal */}
        {searchLog.length > 0 && (
          <div ref={logRef} style={s.terminal}>
            {searchLog.map(entry => (
              <p key={entry.id} style={{ ...s.logLine, color: entry.color }}>
                {entry.msg}
              </p>
            ))}
            {searching && (
              <p style={{ ...s.logLine, color: '#94a3b8',
                animation: 'pulse 0.8s ease-in-out infinite' }}>
                {'> '}<span>searching</span>
                <span style={{ animation: 'pulse 0.5s ease-in-out infinite' }}>...</span>
              </p>
            )}
          </div>
        )}

        {/* Found record — show calculation */}
        {foundRecord && (
          <FoundRecord
            record={foundRecord}
            damage={ATTACK_DAMAGE}
            initialHp={INITIAL_HP}
            newHp={newHp}
            writing={writing}
            writeDone={writeDone}
            writeProgress={writeProgress}
            canWrite={canWrite}
            onWrite={onWrite}
          />
        )}

        {/* Done */}
        {writeDone && <DonePanel onComplete={onComplete} />}

      </div>

      {/* Right — vault chambers */}
      <div style={s.taskRight}>
        <p style={s.vaultsLabel}>The Three Chambers</p>
        <div style={s.vaultsList}>
          {VAULT_CHAMBERS.map(chamber => (
            <VaultChamber
              key={chamber.id}
              chamber={chamber}
              searchPhase={searchPhase}
              targetKey={TARGET_KEY}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── FOUND RECORD ────────────────────────────────────────────

function FoundRecord({
  record, damage, initialHp, newHp,
  writing, writeDone, writeProgress,
  canWrite, onWrite
}) {
  const ref = useRef()
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )
  }, [])

  return (
    <div ref={ref} style={fr.wrap}>
      <p style={fr.title}>📄 Record Found</p>

      {/* Record display */}
      <div style={fr.record}>
        <div style={fr.row}>
          <span style={fr.key}>key</span>
          <span style={fr.val}>{record.key}</span>
        </div>
        <div style={fr.row}>
          <span style={fr.key}>current value</span>
          <span style={{ ...fr.val, color: '#94a3b8' }}>{record.value} HP</span>
        </div>
      </div>

      {/* Calculation */}
      <div style={fr.calc}>
        <p style={fr.calcTitle}>Damage Calculation</p>
        <div style={fr.calcRow}>
          <span style={fr.calcItem}>
            <span style={fr.calcLabel}>Current HP</span>
            <span style={fr.calcNum}>{initialHp}</span>
          </span>
          <span style={fr.calcOp}>−</span>
          <span style={fr.calcItem}>
            <span style={fr.calcLabel}>Attack Dmg</span>
            <span style={{ ...fr.calcNum, color: '#ef4444' }}>{damage}</span>
          </span>
          <span style={fr.calcOp}>=</span>
          <span style={fr.calcItem}>
            <span style={fr.calcLabel}>New HP</span>
            <span style={{ ...fr.calcNum, color: '#22c55e' }}>
              {initialHp - damage}
            </span>
          </span>
        </div>
      </div>

      {/* Write progress */}
      {writing && (
        <div style={fr.writeBox}>
          <p style={fr.writeLabel}>Writing to vault... {writeProgress}%</p>
          <div style={fr.writeTrack}>
            <div style={{
              ...fr.writeFill,
              width: `${writeProgress}%`,
            }} />
          </div>
        </div>
      )}

      {/* Written confirmation */}
      {writeDone && (
        <div style={fr.writtenBox}>
          <span style={{ color: '#22c55e' }}>✓</span>
          <span style={fr.writtenText}>
            Written: {record.key} = {initialHp - damage} HP
          </span>
        </div>
      )}

      {/* Write button */}
      {canWrite && (
        <button
          style={fr.writeBtn}
          onClick={onWrite}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(148,163,184,0.15)'
            e.currentTarget.style.borderColor = '#94a3b8'
            e.currentTarget.style.color       = '#cbd5e1'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(148,163,184,0.35)'
            e.currentTarget.style.color       = 'rgba(148,163,184,0.8)'
          }}
        >
          ✏ Write Updated Value to Vault
        </button>
      )}

    </div>
  )
}

// ─── VAULT CHAMBER ───────────────────────────────────────────

function VaultChamber({ chamber, searchPhase, targetKey, searchQuery }) {
  const isSearching = searchPhase === chamber.id
  const isMiss      = searchPhase === 'cache_miss' && chamber.id === 'cache'
  const isFound     = searchPhase === 'found' && chamber.id === 'ssd'
  const isActive    = isSearching || isMiss || isFound

  return (
    <div style={{
      ...vc.wrap,
      borderColor: isFound
        ? '#22c55e'
        : isMiss
        ? '#ef4444'
        : isSearching
        ? chamber.color
        : 'rgba(255,255,255,0.06)',
      background: isFound
        ? 'rgba(34,197,94,0.05)'
        : isMiss
        ? 'rgba(239,68,68,0.04)'
        : isSearching
        ? `rgba(${hexToRgb(chamber.color)}, 0.06)`
        : 'rgba(255,255,255,0.02)',
      transition: 'all 0.4s ease',
    }}>

      {/* Chamber header */}
      <div style={vc.header}>
        <div style={vc.headerLeft}>
          <span style={vc.icon}>{chamber.icon}</span>
          <div>
            <p style={{ ...vc.name, color: chamber.color }}>
              {chamber.name}
            </p>
            <p style={vc.type}>{chamber.type}</p>
          </div>
        </div>
        <div style={vc.stats}>
          <span style={vc.stat}>⚡ {chamber.speed}</span>
          <span style={vc.stat}>💾 {chamber.capacity}</span>
        </div>
      </div>

      <p style={vc.desc}>{chamber.desc}</p>

      {/* Status indicator */}
      {isSearching && (
        <div style={vc.status}>
          <span style={{
            ...vc.statusDot,
            background: chamber.color,
            animation: 'corePulse 0.8s ease-in-out infinite',
          }} />
          <span style={{ ...vc.statusText, color: chamber.color }}>
            Scanning...
          </span>
        </div>
      )}
      {isMiss && (
        <div style={vc.status}>
          <span style={{ ...vc.statusDot, background: '#ef4444' }} />
          <span style={{ ...vc.statusText, color: '#ef4444' }}>
            Cache Miss
          </span>
        </div>
      )}
      {isFound && (
        <div style={vc.status}>
          <span style={{ ...vc.statusDot, background: '#22c55e' }} />
          <span style={{ ...vc.statusText, color: '#22c55e' }}>
            Record Found ✓
          </span>
        </div>
      )}

      {/* Records list */}
      <div style={vc.records}>
        {chamber.records.map(record => {
          const isTarget  = record.key === targetKey
          const isMatched = isTarget && (searchPhase === 'found' || searchPhase === 'not_found')

          return (
            <div key={record.key} style={{
              ...vc.record,
              borderColor: isMatched && isFound
                ? 'rgba(34,197,94,0.4)'
                : 'rgba(255,255,255,0.04)',
              background: isMatched && isFound
                ? 'rgba(34,197,94,0.06)'
                : 'transparent',
            }}>
              <span style={{
                ...vc.recordKey,
                color: isMatched && isFound ? '#22c55e' : 'rgba(240,232,208,0.35)',
              }}>
                {record.key}
              </span>
              <span style={{
                ...vc.recordVal,
                color: isMatched && isFound ? '#94a3b8' : 'rgba(240,232,208,0.2)',
              }}>
                {record.value}
              </span>
            </div>
          )
        })}
      </div>

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
      <p style={s.doneTitle}>Vault Updated</p>
      <p style={s.doneText}>
        The enemy's health has been updated in the Crystal Vaults.
        The attack is confirmed. The final step falls to{' '}
        <span style={{ color: '#38bdf8' }}>House Transit</span>{' '}
        — the updated game state must now be sent to the opponent's kingdom.
      </p>
      <div style={s.doneMeta}>
        <span style={s.doneMetaItem}>⏱ 0.2ms read + 0.8ms write</span>
        <span style={s.doneMetaItem}>📦 ~5ms remaining</span>
      </div>
      {onComplete && (
        <button style={s.nextBtn} onClick={handleClick}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(56,189,248,0.15)'
            e.currentTarget.style.borderColor = '#38bdf8'
            e.currentTarget.style.color       = '#7dd3fc'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'
            e.currentTarget.style.color       = 'rgba(56,189,248,0.9)'
          }}
        >
          Enter House Transit →
        </button>
      )}
    </div>
  )
}

// ─── HELPER ──────────────────────────────────────────────────

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '148,163,184'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
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
  bgSvg: {
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
    filter: 'drop-shadow(0 0 16px rgba(148,163,184,0.5))',
  },
  meta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.3em',
    color: 'rgba(148,163,184,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(22px, 4vw, 44px)',
    fontWeight: 700,
    color: '#94a3b8',
    margin: 0,
    letterSpacing: '0.05em',
    textShadow: '0 0 40px rgba(148,163,184,0.3)',
  },
  badge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px',
    border: '0.5px solid rgba(148,163,184,0.3)',
    borderRadius: 4,
    background: 'rgba(148,163,184,0.06)',
  },
  badgeLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.3em',
    color: 'rgba(148,163,184,0.5)',
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(18px, 3vw, 28px)',
    color: '#94a3b8',
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
    color: '#94a3b8',
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
    fontSize: 12,
    letterSpacing: '0.25em',
    color: 'rgba(148,163,184,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  briefTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(18px, 3vw, 30px)',
    color: '#f0e8d0',
    marginTop: -10,
    letterSpacing: '0.05em',
  },
  briefBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: '18px 22px',
    border: '0.5px solid rgba(148,163,184,0.12)',
    borderRadius: 6,
    background: 'rgba(148,163,184,0.02)',
  },
  briefPoint: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  briefIcon: {
    fontSize: 18,
    flexShrink: 0,
    marginTop: 2,
  },
  briefPointTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.4vw, 19px)',
    color: '#94a3b8',
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
    border: '1px solid rgba(148,163,184,0.4)',
    borderRadius: 2,
    color: 'rgba(148,163,184,0.9)',
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
    flex: '1 1 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  taskEyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.3em',
    color: 'rgba(148,163,184,0.45)',
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
  keyHint: {
    color: '#94a3b8',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.95em',
    fontStyle: 'normal',
    cursor: 'pointer',
    borderBottom: '1px dashed rgba(148,163,184,0.4)',
    padding: '0 2px',
  },
  searchBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '14px 16px',
    border: '0.5px solid rgba(148,163,184,0.15)',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.3)',
  },
  searchLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(148,163,184,0.5)',
    letterSpacing: '0.15em',
    margin: 0,
  },
  searchRow: {
    display: 'flex',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(148,163,184,0.2)',
    borderRadius: 2,
    color: '#94a3b8',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.08em',
    outline: 'none',
  },
  searchBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '0.5px solid rgba(148,163,184,0.35)',
    borderRadius: 2,
    color: 'rgba(148,163,184,0.8)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.2em',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  searchHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(239, 164, 132, 0.72)',
    letterSpacing: '0.1em',
    margin: 0,
  },
  terminal: {
    padding: '12px 14px',
    background: 'rgba(0,0,0,0.5)',
    border: '0.5px solid rgba(148,163,184,0.1)',
    borderRadius: 4,
    maxHeight: 160,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  logLine: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.08em',
    margin: 0,
    lineHeight: 1.6,
  },
  vaultsLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.25em',
    color: 'rgba(148,163,184,0.4)',
    textTransform: 'uppercase',
    margin: 0,
  },
  vaultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  doneBox: {
    padding: '18px 22px',
    border: '0.5px solid rgba(148,163,184,0.3)',
    borderRadius: 4,
    background: 'rgba(148,163,184,0.04)',
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
    color: 'rgba(148,163,184,0.5)',
    letterSpacing: '0.1em',
  },
  nextBtn: {
    alignSelf: 'flex-start',
    padding: '11px 26px',
    background: 'transparent',
    border: '1px solid rgba(56,189,248,0.4)',
    borderRadius: 2,
    color: 'rgba(56,189,248,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
}

// Found record styles
const fr = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '14px 16px',
    border: '0.5px solid rgba(148,163,184,0.2)',
    borderRadius: 4,
    background: 'rgba(148,163,184,0.03)',
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.2em',
    color: '#22c55e',
    margin: 0,
    textTransform: 'uppercase',
  },
  record: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    border: '0.5px solid rgba(148,163,184,0.1)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  key: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.25)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  val: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#f0e8d0',
    letterSpacing: '0.08em',
  },
  calc: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  calcTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    margin: 0,
  },
  calcRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  calcItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  calcLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.25)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  calcNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: 18,
    fontWeight: 700,
    color: '#f0e8d0',
    letterSpacing: '0.05em',
  },
  calcOp: {
    fontFamily: 'var(--font-mono)',
    fontSize: 20,
    color: 'rgba(240,232,208,0.3)',
    marginTop: 12,
  },
  writeBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  writeLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(148,163,184,0.7)',
    letterSpacing: '0.1em',
    margin: 0,
  },
  writeTrack: {
    height: 4,
    background: 'rgba(148,163,184,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  writeFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
    borderRadius: 2,
    transition: 'width 0.1s linear',
    boxShadow: '0 0 8px rgba(148,163,184,0.5)',
  },
  writtenBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    border: '0.5px solid rgba(34,197,94,0.3)',
    borderRadius: 3,
    background: 'rgba(34,197,94,0.05)',
  },
  writtenText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#22c55e',
    letterSpacing: '0.1em',
  },
  writeBtn: {
    alignSelf: 'flex-start',
    padding: '10px 20px',
    background: 'transparent',
    border: '0.5px solid rgba(148,163,184,0.35)',
    borderRadius: 2,
    color: 'rgba(148,163,184,0.8)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 11px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
}

// Vault chamber styles
const vc = {
  wrap: {
    padding: '12px 14px',
    border: '0.5px solid',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'all 0.4s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 18,
    flexShrink: 0,
    marginTop: -5
  },
  name: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    margin: 0,
  },
  type: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.25)',
    letterSpacing: '0.15em',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  stats: {
    display: 'flex',
    gap: 8,
  },
  stat: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240, 232, 208, 0.45)',
    letterSpacing: '0.08em',
  },
  desc: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'rgba(240,232,208,0.3)',
    fontStyle: 'italic',
    margin: 0,
    lineHeight: 1.5,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    marginRight: 5
  },
  statusText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  records: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  record: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    border: '0.5px solid',
    borderRadius: 2,
    transition: 'all 0.3s ease',
  },
  recordKey: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.06em',
    transition: 'color 0.3s ease',
  },
  recordVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.06em',
    transition: 'color 0.3s ease',
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
    fontSize: 'clamp(8px, 0.9vw, 12px)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    margin: 0,
    textAlign: 'center',
    maxWidth: 150,
    lineHeight: 1.4,
  },
  connector: {
    position: 'relative',
    height: 2,
    marginBottom: 30,
  },
  connectorBg: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(148,163,184,0.12)',
    borderRadius: 1,
  },
  connectorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 1,
    boxShadow: '0 0 8px rgba(148,163,184,0.4)',
  },
}