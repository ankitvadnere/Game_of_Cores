import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'

// ─── DATA ────────────────────────────────────────────────────

const SIGNAL_PATH = [
  { label: 'The Vaults',    img: '/images/Vault.png'   },
  { label: 'Kingdom Gates', img: '/images/Kingdom_gates.png'    },
]

const ROUTES = [
  {
    id: 'fiber',
    name: 'Fiber Highway',
    type: 'Fiber Optic',
    icon: '⚡',
    color: '#38bdf8',
    latency: 12,
    bandwidth: '10Gbps',
    reliability: 99,
    desc: 'Direct fiber connection — fastest and most reliable',
  },
  {
    id: 'cable',
    name: 'Cable Road',
    type: 'Broadband',
    icon: '🔌',
    color: '#a78bfa',
    latency: 28,
    bandwidth: '1Gbps',
    reliability: 94,
    desc: 'Standard broadband — good speed, occasional packet loss',
  },
  {
    id: 'wireless',
    name: 'Wind Messenger',
    type: 'WiFi 6E',
    icon: '📡',
    color: '#f59e0b',
    latency: 45,
    bandwidth: '500Mbps',
    reliability: 87,
    desc: 'Wireless route — convenient but higher latency',
  },
]

const TOTAL_PACKETS  = 24
const PACKET_SIZE_KB = 1.5
const PAYLOAD_KB     = TOTAL_PACKETS * PACKET_SIZE_KB  // 36KB

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

export default function HouseTransit({ onComplete }) {
  const [phase, setPhase]             = useState('signal')
  const [signalStep, setSignalStep]   = useState(0)

  const [selectedRoute, setSelectedRoute] = useState(null)
  const [dispatching,   setDispatching]   = useState(false)
  const [packets,       setPackets]       = useState([])
  // packet: { id, status: 'queued'|'traveling'|'arrived'|'lost' }
  const [dispatchDone,  setDispatchDone]  = useState(false)
  const [lostPackets,   setLostPackets]   = useState([])
  const [retrying,      setRetrying]      = useState(false)
  const [retryDone,     setRetryDone]     = useState(false)
  const [assembling,    setAssembling]    = useState(false)
  const [assembled,     setAssembled]     = useState(false)

  const mapRef = useRef()

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

  // ── Init packets ──
  const initPackets = useCallback((route) => {
    const arr = Array.from({ length: TOTAL_PACKETS }, (_, i) => ({
      id:     i + 1,
      status: 'queued',
    }))
    setPackets(arr)
    return arr
  }, [])

  // ── Dispatch handler ──
  const handleDispatch = () => {
    if (!selectedRoute || dispatching) return
    const route  = ROUTES.find(r => r.id === selectedRoute)
    const pkts   = initPackets(route)
    setDispatching(true)
    setLostPackets([])
    setDispatchDone(false)
    setRetrying(false)
    setRetryDone(false)
    setAssembling(false)
    setAssembled(false)

    // Send packets one by one with stagger
    pkts.forEach((pkt, i) => {
      // Mark traveling
      setTimeout(() => {
        setPackets(prev => prev.map(p =>
          p.id === pkt.id ? { ...p, status: 'traveling' } : p
        ))
      }, i * 120)

      // Mark arrived or lost
      const travelTime = route.latency * 1.5 + i * 120
      setTimeout(() => {
        const isLost = Math.random() * 100 > route.reliability
        setPackets(prev => prev.map(p =>
          p.id === pkt.id
            ? { ...p, status: isLost ? 'lost' : 'arrived' }
            : p
        ))
        if (isLost) {
          setLostPackets(prev => [...prev, pkt.id])
        }
      }, travelTime + route.latency * 2)
    })

    // After all packets sent
    const totalTime = TOTAL_PACKETS * 120 + route.latency * 4
    setTimeout(() => {
      setDispatching(false)
      setDispatchDone(true)
    }, totalTime)
  }

  // ── Retry lost packets ──
  const handleRetry = () => {
    if (lostPackets.length === 0) {
      startAssembly()
      return
    }
    setRetrying(true)

    lostPackets.forEach((pktId, i) => {
      setTimeout(() => {
        setPackets(prev => prev.map(p =>
          p.id === pktId ? { ...p, status: 'traveling' } : p
        ))
      }, i * 200)

      setTimeout(() => {
        setPackets(prev => prev.map(p =>
          p.id === pktId ? { ...p, status: 'arrived' } : p
        ))
      }, i * 200 + 600)
    })

    setTimeout(() => {
      setRetrying(false)
      setRetryDone(true)
      setLostPackets([])
      setTimeout(() => startAssembly(), 400)
    }, lostPackets.length * 200 + 700)
  }

  // ── Assemble packets ──
  const startAssembly = () => {
    setAssembling(true)
    setTimeout(() => {
      setAssembling(false)
      setAssembled(true)
    }, 1800)
  }

  const arrivedCount  = packets.filter(p => p.status === 'arrived').length
  const travelingCount = packets.filter(p => p.status === 'traveling').length

  return (
    <div style={s.section}>

      {/* Network grid background */}
      <svg style={s.bgSvg} width="100%" height="100%">
        {[8,20,32,44,56,68,80,92].map(y => (
          <line key={`h${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
            stroke="#38bdf8" strokeWidth="0.4" strokeDasharray="4 20" opacity="0.05" />
        ))}
        {[8,20,32,44,56,68,80,92].map(x => (
          <line key={`v${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
            stroke="#38bdf8" strokeWidth="0.4" strokeDasharray="4 20" opacity="0.05" />
        ))}
        {/* Diagonal routes */}
        <line x1="0" y1="30%" x2="100%" y2="70%"
          stroke="#38bdf8" strokeWidth="0.3" opacity="0.04" />
        <line x1="0" y1="70%" x2="100%" y2="30%"
          stroke="#38bdf8" strokeWidth="0.3" opacity="0.04" />
      </svg>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.symbol}>🌐</span>
          <div>
            <p style={s.meta}>House Transit · The Kingdom Gates</p>
            <h2 style={s.title}>The Network</h2>
          </div>
        </div>
        <div style={s.badge}>
          <span style={s.badgeLabel}>Frame Budget</span>
          <span style={s.badgeValue}>~5ms</span>
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
          selectedRoute={selectedRoute}
          dispatching={dispatching}
          packets={packets}
          dispatchDone={dispatchDone}
          lostPackets={lostPackets}
          retrying={retrying}
          retryDone={retryDone}
          assembling={assembling}
          assembled={assembled}
          arrivedCount={arrivedCount}
          travelingCount={travelingCount}
          mapRef={mapRef}
          onSelectRoute={setSelectedRoute}
          onDispatch={handleDispatch}
          onRetry={handleRetry}
          onComplete={onComplete}
        />
      )}

    </div>
  )
}

// ─── SIGNAL TRAVEL ───────────────────────────────────────────

function SignalTravel({ steps, currentStep, onTypewriterDone }) {
  const fullText = `The vault has been updated. One final task remains. The complete game state — the attack, the damage, the new health value — must be broken into caravans and dispatched to the opponent's kingdom across the world.`
  const [typingDone, setTypingDone] = useState(false)

  const displayed = useTypewriter(fullText, 25, () => {
    setTypingDone(true)
    onTypewriterDone()
  })

  return (
    <div style={s.signalWrap}>
      <p style={s.signalTitle}>Final Order from House Eternal</p>
      <p style={s.signalSub}>
        {displayed}
        {!typingDone && (
          <span style={{ animation: 'pulse 0.8s ease-in-out infinite', color: '#38bdf8' }}>|</span>
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
                    borderColor: isCompleted ? '#38bdf8' : 'rgba(56,189,248,0.2)',
                    boxShadow:   isCompleted ? '0 0 16px rgba(56,189,248,0.5)' : 'none',
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
                    color: isCompleted ? '#38bdf8' : 'rgba(240,232,208,0.3)',
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
                      background: 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
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
      <p style={s.briefScrollLabel}>📜 Final Decree — House Transit</p>
      <h3 style={s.briefTitle}>What is the Network?</h3>
      <div style={s.briefBody}>
        <BriefPoint icon="📦" title="Caravans — The Packets"
          text="Data on the internet never travels as one piece. It is broken into small packets — typically 1.5KB each. Each packet is addressed, stamped, and dispatched independently, potentially taking different routes." />
        <BriefPoint icon="🗺️" title="The Route — IP and DNS"
          text="Every kingdom on the internet has an address — an IP address. Before dispatching, the DNS directory is consulted: 'What is the IP of the opponent's kingdom?' Only then can caravans be routed correctly." />
        <BriefPoint icon="🤝" title="TCP — The Formal Treaty"
          text="TCP requires every packet to be acknowledged upon arrival. If a packet is lost, it is automatically requested again. This guarantees all data arrives intact — critical for game state accuracy." />
        <BriefPoint icon="⚡" title="Latency — The Road Length"
          text="Even at light speed, distance takes time. A packet from Mumbai to London takes ~120ms. Choosing the right route — fiber, broadband, or wireless — determines how fast your attack reaches the opponent." />
      </div>
      <button style={s.startBtn} onClick={onStart}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'rgba(56,189,248,0.12)'
          e.currentTarget.style.borderColor = '#38bdf8'
          e.currentTarget.style.color       = '#7dd3fc'
          e.currentTarget.style.boxShadow   = '0 0 30px rgba(56,189,248,0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'
          e.currentTarget.style.color       = 'rgba(56,189,248,0.9)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      >
        🌐 Open the Kingdom Gates →
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
  selectedRoute, dispatching, packets, dispatchDone,
  lostPackets, retrying, retryDone, assembling, assembled,
  arrivedCount, travelingCount, mapRef,
  onSelectRoute, onDispatch, onRetry, onComplete
}) {
  const ref = useRef()
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )
  }, [])

  const route        = ROUTES.find(r => r.id === selectedRoute)
  const canDispatch  = selectedRoute && !dispatching && !dispatchDone
  const needsRetry   = dispatchDone && lostPackets.length > 0 && !retryDone
  const canAssemble  = dispatchDone && lostPackets.length === 0 && !assembling && !assembled

  return (
    <div ref={ref} style={s.taskPanel}>

      {/* Left — route selection + controls */}
      <div style={s.taskLeft}>

        <p style={s.taskEyebrow}>Kingdom Gates · Packet Dispatch</p>
        <h3 style={s.taskTitle}>Dispatch the Caravans</h3>
        <p style={s.taskDesc}>
          The game state is{' '}
          <span style={{ color: '#38bdf8', fontStyle: 'normal', fontWeight: 600 }}>
            {PAYLOAD_KB}KB
          </span>
          {' '}— broken into{' '}
          <span style={{ color: '#38bdf8', fontStyle: 'normal', fontWeight: 600 }}>
            {TOTAL_PACKETS} packets
          </span>
          . Choose a route and dispatch all caravans to the opponent's kingdom.
        </p>

        {/* Route selector */}
        {!dispatching && !dispatchDone && (
          <div style={s.routeList}>
            <p style={s.routeListLabel}>Available Routes:</p>
            {ROUTES.map(r => (
              <RouteCard
                key={r.id}
                route={r}
                selected={selectedRoute === r.id}
                onSelect={() => onSelectRoute(r.id)}
              />
            ))}
          </div>
        )}

        {/* Selected route summary */}
        {route && !dispatchDone && (
          <div style={s.routeSummary}>
            <div style={s.routeSummaryRow}>
              <span style={s.routeSummaryLabel}>Route</span>
              <span style={{ ...s.routeSummaryVal, color: route.color }}>
                {route.name}
              </span>
            </div>
            <div style={s.routeSummaryRow}>
              <span style={s.routeSummaryLabel}>Latency</span>
              <span style={s.routeSummaryVal}>{route.latency}ms</span>
            </div>
            <div style={s.routeSummaryRow}>
              <span style={s.routeSummaryLabel}>Reliability</span>
              <span style={{
                ...s.routeSummaryVal,
                color: route.reliability > 95 ? '#22c55e'
                  : route.reliability > 90 ? '#f59e0b'
                  : '#ef4444',
              }}>
                {route.reliability}%
              </span>
            </div>
            <div style={s.routeSummaryRow}>
              <span style={s.routeSummaryLabel}>Packets</span>
              <span style={s.routeSummaryVal}>{TOTAL_PACKETS} caravans</span>
            </div>
          </div>
        )}

        {/* Dispatch button */}
        {!dispatchDone && (
          <button
            style={{
              ...s.dispatchBtn,
              opacity: canDispatch ? 1 : 0.4,
              cursor:  canDispatch ? 'pointer' : 'not-allowed',
            }}
            onClick={onDispatch}
            disabled={!canDispatch}
            onMouseEnter={e => {
              if (!canDispatch) return
              e.currentTarget.style.background  = 'rgba(56,189,248,0.12)'
              e.currentTarget.style.borderColor = '#38bdf8'
              e.currentTarget.style.color       = '#7dd3fc'
              e.currentTarget.style.boxShadow   = '0 0 30px rgba(56,189,248,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'
              e.currentTarget.style.color       = 'rgba(56,189,248,0.8)'
              e.currentTarget.style.boxShadow   = 'none'
            }}
          >
            {dispatching
              ? `📡 Dispatching caravans... ${arrivedCount}/${TOTAL_PACKETS}`
              : !selectedRoute
              ? '← Select a route first'
              : '📡 Dispatch All Caravans'
            }
          </button>
        )}

        {/* Lost packets warning */}
        {needsRetry && (
          <div style={s.lostBox}>
            <p style={s.lostTitle}>
              ⚠ {lostPackets.length} packet{lostPackets.length > 1 ? 's' : ''} lost in transit
            </p>
            <p style={s.lostDesc}>
              TCP detected missing caravans. They must be retransmitted before the data can be assembled.
            </p>
            <button
              style={s.retryBtn}
              onClick={onRetry}
              disabled={retrying}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'rgba(245,158,11,0.15)'
                e.currentTarget.style.borderColor = '#f59e0b'
                e.currentTarget.style.color       = '#fcd34d'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'
                e.currentTarget.style.color       = 'rgba(245,158,11,0.9)'
              }}
            >
              {retrying
                ? `⏳ Retransmitting... ${lostPackets.length} remaining`
                : `🔄 Retransmit ${lostPackets.length} Lost Packet${lostPackets.length > 1 ? 's' : ''}`
              }
            </button>
          </div>
        )}

        {/* All arrived — assemble */}
        {(canAssemble || retryDone) && !assembling && !assembled && (
          <div style={s.assembleBox}>
            <p style={s.assembleTitle}>
              ✓ All {TOTAL_PACKETS} packets arrived
            </p>
            <p style={s.assembleDesc}>
              All caravans have reached the opponent's kingdom.
              TCP must now reassemble them in the correct order.
            </p>
            <button
              style={s.assembleBtn}
              onClick={onRetry}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'rgba(56,189,248,0.12)'
                e.currentTarget.style.borderColor = '#38bdf8'
                e.currentTarget.style.color       = '#7dd3fc'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'
                e.currentTarget.style.color       = 'rgba(56,189,248,0.9)'
              }}
            >
              🔗 Assemble Packets in Order
            </button>
          </div>
        )}

        {/* Assembling */}
        {assembling && (
          <div style={s.assemblingBox}>
            <p style={s.assemblingText}>
              Reassembling {TOTAL_PACKETS} packets in sequence order...
            </p>
            <div style={s.assembleTrack}>
              <div style={{
                ...s.assembleFill,
                animation: 'loadingBar 1.8s linear forwards',
              }} />
            </div>
          </div>
        )}

        {/* Done */}
        {assembled && <DonePanel onComplete={onComplete} route={route} />}

      </div>

      {/* Right — packet grid + map */}
      <div style={s.taskRight}>

        {/* Packet grid */}
        <p style={s.gridLabel}>
          Packet Grid — {TOTAL_PACKETS} Caravans
        </p>
        <PacketGrid packets={packets} />

        {/* Stats */}
        {packets.length > 0 && (
          <div style={s.packetStats}>
            <PacketStat label="Arrived" count={arrivedCount} color="#22c55e" />
            <PacketStat label="Traveling" count={travelingCount} color="#38bdf8" />
            <PacketStat
              label="Lost"
              count={lostPackets.length}
              color={lostPackets.length > 0 ? '#ef4444' : 'rgba(240,232,208,0.2)'}
            />
            <PacketStat
              label="Queued"
              count={packets.filter(p => p.status === 'queued').length}
              color="rgba(240,232,208,0.2)"
            />
          </div>
        )}

        {/* Network map */}
        <NetworkMap
          ref={mapRef}
          selectedRoute={selectedRoute}
          dispatching={dispatching}
          dispatchDone={dispatchDone}
          assembled={assembled}
        />

      </div>

    </div>
  )
}

// ─── ROUTE CARD ──────────────────────────────────────────────

function RouteCard({ route, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        ...rc.wrap,
        borderColor: selected ? route.color : 'rgba(255,255,255,0.07)',
        background:  selected
          ? `rgba(${hexToRgb(route.color)}, 0.08)`
          : 'rgba(255,255,255,0.02)',
        boxShadow: selected
          ? `0 0 20px rgba(${hexToRgb(route.color)}, 0.15)`
          : 'none',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={rc.left}>
        <span style={rc.icon}>{route.icon}</span>
        <div>
          <p style={{ ...rc.name, color: selected ? route.color : 'rgba(240,232,208,0.7)' }}>
            {route.name}
          </p>
          <p style={rc.type}>{route.type} · {route.bandwidth}</p>
        </div>
      </div>
      <div style={rc.right}>
        <div style={rc.stat}>
          <span style={rc.statLabel}>Latency</span>
          <span style={{
            ...rc.statVal,
            color: route.latency < 20 ? '#22c55e'
              : route.latency < 35 ? '#f59e0b'
              : '#ef4444',
          }}>
            {route.latency}ms
          </span>
        </div>
        <div style={rc.stat}>
          <span style={rc.statLabel}>Reliability</span>
          <span style={{
            ...rc.statVal,
            color: route.reliability > 95 ? '#22c55e'
              : route.reliability > 90 ? '#f59e0b'
              : '#ef4444',
          }}>
            {route.reliability}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── PACKET GRID ─────────────────────────────────────────────

function PacketGrid({ packets }) {
  if (packets.length === 0) {
    return (
      <div style={pg.empty}>
        <p style={pg.emptyText}>Select a route and dispatch to see packets</p>
      </div>
    )
  }

  return (
    <div style={pg.grid}>
      {packets.map(pkt => (
        <div
          key={pkt.id}
          title={`Packet #${pkt.id} — ${pkt.status}`}
          style={{
            ...pg.packet,
            background: pkt.status === 'arrived'   ? '#22c55e'
              : pkt.status === 'traveling' ? '#38bdf8'
              : pkt.status === 'lost'      ? '#ef4444'
              : 'rgba(255,255,255,0.08)',
            boxShadow: pkt.status === 'traveling'
              ? '0 0 6px rgba(56,189,248,0.8)'
              : pkt.status === 'arrived'
              ? '0 0 4px rgba(34,197,94,0.5)'
              : 'none',
            animation: pkt.status === 'traveling'
              ? 'corePulse 0.6s ease-in-out infinite'
              : 'none',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

function PacketStat({ label, count, color }) {
  return (
    <div style={pg.statWrap}>
      <span style={{ ...pg.statDot, background: color }} />
      <span style={pg.statLabel}>{label}</span>
      <span style={{ ...pg.statCount, color }}>{count}</span>
    </div>
  )
}

// ─── NETWORK MAP ─────────────────────────────────────────────

const NetworkMap = ({ selectedRoute, dispatching, dispatchDone, assembled }) => {
  const route = ROUTES.find(r => r.id === selectedRoute)

  return (
    <div style={nm.wrap}>
      <p style={nm.label}>Network Map</p>
      <svg viewBox="0 0 400 160" style={nm.svg}>

        {/* Background grid */}
        {[40,80,120].map(y => (
          <line key={y} x1="0" y1={y} x2="400" y2={y}
            stroke="rgba(56,189,248,0.06)" strokeWidth="0.5" />
        ))}
        {[80,160,240,320].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="160"
            stroke="rgba(56,189,248,0.06)" strokeWidth="0.5" />
        ))}

        {/* Route lines */}
        {/* Fiber — straight */}
        <path d="M 60 80 L 340 80"
          stroke={selectedRoute === 'fiber' ? '#38bdf8' : 'rgba(56,189,248,0.15)'}
          strokeWidth={selectedRoute === 'fiber' ? 2 : 1}
          fill="none"
          strokeDasharray={dispatching && selectedRoute === 'fiber' ? '6 4' : 'none'}
        >
          {dispatching && selectedRoute === 'fiber' && (
            <animate attributeName="stroke-dashoffset"
              from="0" to="-20" dur="0.5s" repeatCount="indefinite" />
          )}
        </path>

        {/* Broadband — slight curve */}
        <path d="M 60 80 Q 200 40 340 80"
          stroke={selectedRoute === 'cable' ? '#a78bfa' : 'rgba(167,139,250,0.12)'}
          strokeWidth={selectedRoute === 'cable' ? 2 : 1}
          fill="none"
          strokeDasharray={dispatching && selectedRoute === 'cable' ? '6 4' : 'none'}
        />

        {/* WiFi — bigger curve */}
        <path d="M 60 80 Q 200 130 340 80"
          stroke={selectedRoute === 'wireless' ? '#f59e0b' : 'rgba(245,158,11,0.12)'}
          strokeWidth={selectedRoute === 'wireless' ? 2 : 1}
          fill="none"
          strokeDasharray={dispatching && selectedRoute === 'wireless' ? '6 4' : 'none'}
        />

        {/* Source kingdom */}
        <rect x="20" y="60" width="40" height="40"
          fill="rgba(201,168,76,0.1)"
          stroke={assembled ? '#22c55e' : '#c9a84c'}
          strokeWidth="1.5" rx="3" />
        <text x="40" y="78" textAnchor="middle"
          fill="#c9a84c" fontSize="8" fontFamily="monospace">YOUR</text>
        <text x="40" y="90" textAnchor="middle"
          fill="#c9a84c" fontSize="8" fontFamily="monospace">KINGDOM</text>
        <text x="40" y="110" textAnchor="middle"
          fill="rgba(201,168,76,0.5)" fontSize="6" fontFamily="monospace">192.168.1.1</text>

        {/* Destination kingdom */}
        <rect x="340" y="60" width="40" height="40"
          fill={assembled ? 'rgba(34,197,94,0.1)' : 'rgba(56,189,248,0.08)'}
          stroke={assembled ? '#22c55e' : 'rgba(56,189,248,0.4)'}
          strokeWidth="1.5" rx="3" />
        <text x="360" y="78" textAnchor="middle"
          fill={assembled ? '#22c55e' : 'rgba(56,189,248,0.6)'}
          fontSize="8" fontFamily="monospace">OPP</text>
        <text x="360" y="90" textAnchor="middle"
          fill={assembled ? '#22c55e' : 'rgba(56,189,248,0.6)'}
          fontSize="8" fontFamily="monospace">KINGDOM</text>
        <text x="360" y="110" textAnchor="middle"
          fill="rgba(56,189,248,0.3)" fontSize="6" fontFamily="monospace">203.0.113.42</text>

        {/* Moving packet dot */}
        {dispatching && route && (
          <circle r="4" fill={route.color} opacity="0.9">
            <animateMotion
              dur={`${route.latency / 30}s`}
              repeatCount="indefinite"
              path={
                selectedRoute === 'fiber'    ? 'M 60 80 L 340 80'
                : selectedRoute === 'cable'  ? 'M 60 80 Q 200 40 340 80'
                : 'M 60 80 Q 200 130 340 80'
              }
            />
          </circle>
        )}

        {/* Assembled checkmark */}
        {assembled && (
          <>
            <text x="360" y="55" textAnchor="middle"
              fill="#22c55e" fontSize="12" fontFamily="monospace">✓</text>
          </>
        )}

        {/* Route labels */}
        <text x="200" y="73" textAnchor="middle"
          fill="rgba(56,189,248,0.4)" fontSize="6" fontFamily="monospace">
          FIBER — 12ms
        </text>
        <text x="200" y="35" textAnchor="middle"
          fill="rgba(167,139,250,0.3)" fontSize="6" fontFamily="monospace">
          BROADBAND — 28ms
        </text>
        <text x="200" y="142" textAnchor="middle"
          fill="rgba(245,158,11,0.3)" fontSize="6" fontFamily="monospace">
          WIFI — 45ms
        </text>

      </svg>
    </div>
  )
}

// ─── DONE PANEL ──────────────────────────────────────────────

function DonePanel({ onComplete, route }) {
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
      <p style={s.doneTitle}>Transmission Complete</p>
      <p style={s.doneText}>
        All {TOTAL_PACKETS} packets have arrived and been reassembled in sequence.
        The opponent's kingdom has received the full game state —
        the attack, the damage, the new enemy health.
        The frame is delivered. The warrior's blow has landed.
      </p>
      {route && (
        <div style={s.doneMeta}>
          <span style={s.doneMetaItem}>📡 Route: {route.name}</span>
          <span style={s.doneMetaItem}>⏱ {route.latency}ms latency</span>
          <span style={s.doneMetaItem}>📦 {TOTAL_PACKETS} packets</span>
        </div>
      )}
      {onComplete && (
        <button style={s.nextBtn} onClick={handleClick}
          onMouseEnter={e => {
            e.currentTarget.style.background  = 'rgba(201,168,76,0.15)'
            e.currentTarget.style.borderColor = '#c9a84c'
            e.currentTarget.style.color       = '#f0c040'
            e.currentTarget.style.boxShadow   = '0 0 40px rgba(201,168,76,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
            e.currentTarget.style.color       = 'rgba(201,168,76,0.9)'
            e.currentTarget.style.boxShadow   = 'none'
          }}
        >
          ⚔ See the Victory →
        </button>
      )}
    </div>
  )
}

// ─── VICTORY SCREEN (rendered by App after all houses complete) ───────────

export function VictoryScreen() {
  const ref      = useRef()
  const titleRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(ref.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.2, ease: 'power2.out' }
    )
    tl.fromTo(titleRef.current,
      { opacity: 0, y: 40, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.4)' },
      '-=0.4'
    )
    tl.fromTo('.victory-line',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' },
      '-=0.3'
    )
    tl.fromTo('.victory-house',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.6)' },
      '-=0.2'
    )
  }, [])

  const HOUSES = [
    { name: 'House Core',     color: '#c9a84c', symbol: '⚙', role: 'The King commanded' },
    { name: 'House Volatile', color: '#a78bfa', symbol: '⚡', role: 'The Hall remembered' },
    { name: 'House Render',   color: '#34d399', symbol: '🎨', role: 'The Artists painted' },
    { name: 'House Eternal',  color: '#94a3b8', symbol: '🗄', role: 'The Vault recorded' },
    { name: 'House Transit',  color: '#38bdf8', symbol: '🌐', role: 'The Gates dispatched' },
  ]

  return (
    <div ref={ref} style={vs.section}>

      {/* Stars */}
      <div style={vs.stars} aria-hidden>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width:  Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            background: '#fff',
            borderRadius: '50%',
            left:   Math.random() * 100 + '%',
            top:    Math.random() * 100 + '%',
            opacity: Math.random() * 0.6 + 0.1,
            animation: `sparkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 3 + 's',
          }} />
        ))}
      </div>

      {/* Title */}
      <div ref={titleRef} style={vs.titleWrap}>
        <p style={vs.eyebrow}>Frame Delivered · 16ms Complete</p>
        <h1 style={vs.title}>One Frame of Glory</h1>
        <div style={vs.titleLine} />
      </div>

      {/* Narration */}
      <div style={vs.narration}>
        <p className="victory-line" style={vs.narLine}>
          Sixteen milliseconds. That is all it took.
        </p>
        <p className="victory-line" style={vs.narLine}>
          Eight cores thinking. Thousands of painters painting.
        </p>
        <p className="victory-line" style={vs.narLine}>
          Ancient vaults searched. Twenty-four caravans dispatched across the world.
        </p>
        <p className="victory-line" style={{ ...vs.narLine, color: '#c9a84c', fontStyle: 'normal' }}>
          And the warrior never noticed. They only saw their sword connect.
        </p>
      </div>

      {/* Five houses */}
      <div style={vs.housesRow}>
        {HOUSES.map(house => (
          <div key={house.name} className="victory-house" style={vs.houseCard}>
            <div style={{
              ...vs.houseOrb,
              border: `solid 2px ${house.color}`,
              boxShadow: `0 0 24px ${house.color}66`,
            }}>
              <span style={vs.houseSymbol}>{house.symbol}</span>
            </div>
            <p style={{ ...vs.houseName, color: house.color }}>{house.name}</p>
            <p style={vs.houseRole}>{house.role}</p>
          </div>
        ))}
      </div>

      {/* Counter */}
      <FrameCounter />

      {/* Final quote */}
      <p className="victory-line" style={vs.finalQuote}>
        "This invisible miracle happens sixty times every second,
        every second you are near a screen."
      </p>

    </div>
  )
}

function FrameCounter() {
  const [frames, setFrames] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      setFrames(Math.round(elapsed * 60))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="victory-line" style={vs.counterWrap}>
      <p style={vs.counterLabel}>
        Frames rendered on your device since you loaded the Victory Screen
      </p>
      <p style={vs.counterValue}>
        {frames.toLocaleString()}
      </p>
    </div>
  )
}

// ─── HELPER ──────────────────────────────────────────────────

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '56,189,248'
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
    filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.6))',
  },
  meta: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 11px)',
    letterSpacing: '0.3em',
    color: 'rgba(56,189,248,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(22px, 4vw, 44px)',
    fontWeight: 700,
    color: '#38bdf8',
    margin: 0,
    letterSpacing: '0.05em',
    textShadow: '0 0 40px rgba(56,189,248,0.3)',
  },
  badge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px',
    border: '0.5px solid rgba(56,189,248,0.3)',
    borderRadius: 4,
    background: 'rgba(56,189,248,0.06)',
  },
  badgeLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.3em',
    color: 'rgba(56,189,248,0.5)',
    textTransform: 'uppercase',
  },
  badgeValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(18px, 3vw, 28px)',
    color: '#38bdf8',
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
    color: '#38bdf8',
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
    color: 'rgba(56,189,248,0.5)',
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
    border: '0.5px solid rgba(56,189,248,0.12)',
    borderRadius: 6,
    background: 'rgba(56,189,248,0.02)',
  },
  briefPoint: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  briefIcon: {
    fontSize: 19,
    flexShrink: 0,
    marginTop: -2,
  },
  briefPointTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.4vw, 19px)',
    color: '#38bdf8',
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
    border: '1px solid rgba(56,189,248,0.4)',
    borderRadius: 2,
    color: 'rgba(56,189,248,0.9)',
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
    gap: 14,
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
    color: 'rgba(56,189,248,0.45)',
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
  routeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  routeListLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.25em',
    color: 'rgba(56,189,248,0.4)',
    textTransform: 'uppercase',
    margin: 0,
  },
  routeSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '12px 14px',
    border: '0.5px solid rgba(56,189,248,0.15)',
    borderRadius: 4,
    background: 'rgba(56,189,248,0.03)',
  },
  routeSummaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeSummaryLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  routeSummaryVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#f0e8d0',
    letterSpacing: '0.08em',
  },
  dispatchBtn: {
    padding: '14px 32px',
    background: 'transparent',
    border: '1px solid rgba(56,189,248,0.4)',
    borderRadius: 2,
    color: 'rgba(56,189,248,0.8)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(10px, 1.1vw, 12px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
  },
  lostBox: {
    padding: '14px 16px',
    border: '0.5px solid rgba(239,68,68,0.3)',
    borderRadius: 4,
    background: 'rgba(239,68,68,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  lostTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#ef4444',
    letterSpacing: '0.1em',
    margin: 0,
  },
  lostDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    color: 'rgba(240,232,208,0.5)',
    fontStyle: 'italic',
    lineHeight: 1.6,
    margin: 0,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    padding: '10px 20px',
    background: 'transparent',
    border: '0.5px solid rgba(245,158,11,0.4)',
    borderRadius: 2,
    color: 'rgba(245,158,11,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  assembleBox: {
    padding: '14px 16px',
    border: '0.5px solid rgba(56,189,248,0.25)',
    borderRadius: 4,
    background: 'rgba(56,189,248,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  assembleTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    color: '#22c55e',
    letterSpacing: '0.1em',
    margin: 0,
  },
  assembleDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: 16,
    color: 'rgba(240,232,208,0.5)',
    fontStyle: 'italic',
    lineHeight: 1.6,
    margin: 0,
  },
  assembleBtn: {
    alignSelf: 'flex-start',
    padding: '10px 20px',
    background: 'transparent',
    border: '0.5px solid rgba(56,189,248,0.4)',
    borderRadius: 2,
    color: 'rgba(56,189,248,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  assemblingBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '12px 14px',
    border: '0.5px solid rgba(56,189,248,0.2)',
    borderRadius: 4,
  },
  assemblingText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(56,189,248,0.7)',
    letterSpacing: '0.1em',
    margin: 0,
    animation: 'pulse 1s ease-in-out infinite',
  },
  assembleTrack: {
    height: 4,
    background: 'rgba(56,189,248,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  assembleFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
    borderRadius: 2,
    width: '0%',
    boxShadow: '0 0 8px rgba(56,189,248,0.5)',
  },
  gridLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.25em',
    color: 'rgba(56,189,248,0.4)',
    textTransform: 'uppercase',
    margin: 0,
  },
  packetStats: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
  },
  doneBox: {
    padding: '18px 22px',
    border: '0.5px solid rgba(56,189,248,0.3)',
    borderRadius: 4,
    background: 'rgba(56,189,248,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
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
    color: 'rgba(56,189,248,0.5)',
    letterSpacing: '0.1em',
  },
  nextBtn: {
    alignSelf: 'flex-start',
    padding: '11px 26px',
    background: 'transparent',
    border: '1px solid rgba(201,168,76,0.4)',
    borderRadius: 2,
    color: 'rgba(201,168,76,0.9)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
}

// Route card styles
const rc = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    border: '0.5px solid',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  icon: {
    fontSize: 18,
    flexShrink: 0,
  },
  name: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    margin: 0,
    transition: 'color 0.3s ease',
  },
  type: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.25)',
    letterSpacing: '0.1em',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  right: {
    display: 'flex',
    gap: 16,
    flexShrink: 0,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'rgba(240,232,208,0.2)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  statVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginTop: 3
  },
}

// Packet grid styles
const pg = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 4,
  },
  packet: {
    aspectRatio: '1',
    borderRadius: 2,
    transition: 'all 0.3s ease',
  },
  empty: {
    padding: '20px',
    border: '0.5px solid rgba(56,189,248,0.1)',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(56,189,248,0.3)',
    letterSpacing: '0.1em',
    margin: 0,
    textAlign: 'center',
  },
  statWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.3s ease',
  },
  statLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.1em',
  },
  statCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    transition: 'color 0.3s ease',
  },
}

// Network map styles
const nm = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.2em',
    color: 'rgba(56,189,248,0.35)',
    textTransform: 'uppercase',
    margin: 0,
  },
  svg: {
    width: '100%',
    border: '0.5px solid rgba(56,189,248,0.12)',
    borderRadius: 4,
    background: 'rgba(0,0,5,0.6)',
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
    fontSize: 'clamp(8px, 0.9vw, 14px)',
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
    background: 'rgba(56,189,248,0.12)',
    borderRadius: 1,
  },
  connectorFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 1,
    boxShadow: '0 0 8px rgba(56,189,248,0.5)',
  },
}

// Victory screen styles
const vs = {
  section: {
    position: 'relative',
    width: '100vw',
    minHeight: '100vh',
    background: '#00000a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(40px, 8vh, 80px) clamp(20px, 6vw, 100px)',
    gap: 'clamp(24px, 5vh, 48px)',
    overflow: 'hidden',
    opacity: 0,
  },
  stars: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  titleWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
    opacity: 0,
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.38em',
    color: 'rgba(201,168,76,0.5)',
    textTransform: 'uppercase',
    margin: 0,
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(20px, 7vw, 80px)',
    fontWeight: 900,
    color: '#c9a84c',
    margin: 0,
    letterSpacing: '0.05em',
    textAlign: 'center',
    textShadow: '0 0 80px rgba(201,168,76,0.4)',
  },
  titleLine: {
    width: 800,
    height: 1,
    background: 'rgba(201,168,76,0.3)',
    borderRadius: 1,
  },
  narration: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    zIndex: 1,
    maxWidth: 680,
    textAlign: 'center',
  },
  narLine: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(14px, 1.8vw, 18px)',
    fontStyle: 'italic',
    color: 'rgba(240,232,208,0.6)',
    margin: 0,
    lineHeight: 1.6,
    opacity: 0,
  },
  housesRow: {
    display: 'flex',
    gap: 'clamp(12px, 2vw, 24px)',
    flexWrap: 'wrap',
    justifyContent: 'center',
    zIndex: 1,
  },
  houseCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 'clamp(14px, 2vw, 26px)',
    border: '0.5px solid rgba(201,168,76,0.15)',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.4)',
    minWidth: 100,
    opacity: 0,
  },
  houseOrb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid'
  },
  houseSymbol: {
    fontSize: 20,
  },
  houseName: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(8px, 0.9vw, 10px)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    marginTop: 2,
    textAlign: 'center',
  },
  houseRole: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(8px, 0.8vw, 10px)',
    color: 'rgba(240,232,208,0.3)',
    marginTop: -3,
    textAlign: 'center',
    letterSpacing: '0.05em',
  },
  counterWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
    opacity: 0,
  },
  counterLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    color: 'rgba(240,232,208,0.3)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    margin: 0,
    textAlign: 'center',
  },
  counterValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(32px, 6vw, 56px)',
    fontWeight: 700,
    color: '#c9a84c',
    marginTop: 10,
    letterSpacing: '0.1em',
    textShadow: '0 0 40px rgba(201,168,76,0.4)',
  },
  finalQuote: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(13px, 1.5vw, 17px)',
    fontStyle: 'italic',
    color: 'rgba(240,232,208,0.35)',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 1.8,
    marginTop: -30,
    marginBottom: -20,
    zIndex: 1,
    opacity: 0,
  },
}