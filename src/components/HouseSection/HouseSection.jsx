import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const HOUSES = [
  {
    id:      'core',
    name:    'House Core',
    role:    'The Throne Room',
    symbol:  '⚙',
    color:   '#c9a84c',
    desc:    'The King who thinks and commands. Every decision in the kingdom flows from here.',
  },
  {
    id:      'volatile',
    name:    'House Volatile',
    role:    'The Grand Hall',
    symbol:  '⚡',
    color:   '#a78bfa',
    desc:    'The royal court that holds all active knowledge — fast, vast, and forgotten at dusk.',
  },
  {
    id:      'render',
    name:    'House Render',
    role:    "The Artists' Quarter",
    symbol:  '🎨',
    color:   '#34d399',
    desc:    'Ten thousand painters working in unison. They paint the world you see, sixty times a second.',
  },
  {
    id:      'eternal',
    name:    'House Eternal',
    role:    'The Underground Vaults',
    symbol:  '🗄',
    color:   '#94a3b8',
    desc:    'The keepers of all memory. They forget nothing — not even what you thought was deleted.',
  },
  {
    id:      'transit',
    name:    'House Transit',
    role:    'The Kingdom Gates',
    symbol:  '🌐',
    color:   '#38bdf8',
    desc:    'Ambassadors to the outside world. Every message sent or received passes through their gates.',
  },
]

export default function HouseSection() {
  const sectionRef = useRef()
  const titleRef   = useRef()
  const cardsRef   = useRef([])

  useEffect(() => {

    // Title animates in first
    gsap.fromTo(titleRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 85%',
          once: true,
        }
      }
    )

    // Cards stagger in one by one
    cardsRef.current.forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 60, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            once: true,
          },
          delay: i * 0.1,   // stagger each card slightly
        }
      )
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <div ref={sectionRef} style={styles.section}>

      {/* Section title */}
      <div ref={titleRef} style={styles.titleBlock}>
        <p style={styles.eyebrow}>Lifeline of the kingdom</p>
        <h2 style={styles.title}>The Five Houses of Siliconium</h2>
        <div style={styles.titleLine} />
      </div>

      {/* Cards row */}
      <div style={styles.cardsRow}>
        {HOUSES.map((house, i) => (
          <HouseCard
            key={house.id}
            house={house}
            ref={el => cardsRef.current[i] = el}
          />
        ))}
      </div>

      <div style={styles.storyDesc}>
        <p>“Welcome to Siliconium. A command has just been issued in the heat of an online multiplayer battle. From this moment on, you’ll trace its entire journey — from CPU execution to frame rendering, and finally, its transmission across the network to your opponent.Scroll down to begin the simulation.”</p>
      </div>

    </div>
  )
}

// Individual card component
import { forwardRef, useState } from 'react'
import { color } from 'framer-motion'

const HouseCard = forwardRef(({ house }, ref) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      ref={ref}
      style={{
        ...styles.card,
        borderColor: hovered
          ? house.color
          : 'rgba(255,255,255,0.07)',
        background: hovered
          ? `rgba(${hexToRgb(house.color)}, 0.07)`
          : 'rgba(255,255,255,0.03)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 60px rgba(${hexToRgb(house.color)}, 0.15)`
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Symbol */}
      <div style={{
        ...styles.symbolWrap,
        background: `rgba(${hexToRgb(house.color)}, 0.1)`,
        boxShadow: hovered
          ? `0 0 30px rgba(${hexToRgb(house.color)}, 0.3)`
          : 'none',
      }}>
        <span style={styles.symbol}>{house.symbol}</span>
      </div>

      {/* House name */}
      <h3 style={{
        ...styles.houseName,
        color: house.color,
      }}>
        {house.name}
      </h3>

      {/* Role */}
      <p style={styles.houseRole}>{house.role}</p>

      {/* Divider */}
      <div style={{
        ...styles.divider,
        background: house.color,
        opacity: hovered ? 0.6 : 0.2,
      }} />

      {/* Description */}
      <p style={styles.houseDesc}>{house.desc}</p>

      {/* Bottom glow line */}
      <div style={{
        ...styles.bottomGlow,
        background: house.color,
        opacity: hovered ? 1 : 0,
      }} />
    </div>
  )
})

// Helper — converts hex color to rgb values for rgba()
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

const styles = {
  section: {
    width: '100vw',
    minHeight: '100vh',
    background: '#00000a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8vh 4vw',
    gap: '6vh',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    opacity: 0,
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(15px, 1vw, 11px)',
    letterSpacing: '0.35em',
    color: 'rgba(201, 168, 76, 0.66)',
    textTransform: 'uppercase',
    margin: 0,
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(28px, 4vw, 52px)',
    fontWeight: 700,
    color: '#f7d262',
    margin: 0,
    letterSpacing: '0.05em',
    textShadow: '0 0 60px rgba(152, 124, 46, 0.2)',
  },
  titleLine: {
    width: 575,
    height: 1,
    background: 'rgba(201,168,76,0.4)',
    borderRadius: 1,
  },
  cardsRow: {
    display: 'flex',
    gap: 'clamp(12px, 2vw, 24px)',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1300,
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 'clamp(20px, 3vw, 36px) clamp(16px, 2vw, 28px)',
    width: 'clamp(160px, 18vw, 220px)',
    border: '0.5px solid rgba(255,255,255,0.07)',
    borderRadius: 6,
    cursor: 'default',
    transition: 'all 0.35s ease',
    overflow: 'hidden',
    opacity: 0,   
  },
  symbolWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow 0.35s ease',
    marginBottom: 4,
  },
  symbol: {
    fontSize: 28,
    lineHeight: 1,
  },
  houseName: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(11px, 1.2vw, 14px)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    margin: 0,
    textAlign: 'center',
  },
  houseRole: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(10px, 0.85vw, 10px)',
    color: 'rgba(255, 236, 236, 0.85)',
    margin: 0,
    letterSpacing: '0.08em',
    textAlign: 'center',
  },
  divider: {
    width: '60%',
    height: '0.5px',
    borderRadius: 1,
    transition: 'opacity 0.35s ease',
  },
  houseDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(11px, 1vw, 13px)',
    lineHeight: 1.7,
    color: 'rgba(240, 232, 208, 0.63)',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: 0,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    transition: 'opacity 0.35s ease',
  },
  storyDesc: {
    display: 'flex',
    width: '70vw',
    height: 'auto',
    fontSize: '1.2rem',
    color: 'rgba(201, 168, 76, 0.66)',
    fontFamily: 'var(--font-body)',
    fontWeight: '200',
    textAlign: 'center'
  }
}