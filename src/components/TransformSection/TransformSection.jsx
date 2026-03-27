import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const MOTHERBOARD_TEXT = {
  title: 'The Silicon Motherboard',
  para: `At first glance, it is nothing more than a slab of fibreglass and copper. 
  But look closer. Every golden trace is a highway carrying billions of electrical 
  signals per second. Every chip is a city unto itself — processing, remembering, 
  rendering, connecting. The motherboard is not just a circuit board. It is the 
  foundation of an entire civilisation that exists inside your device, invisible, 
  tireless, and endlessly complex. This is where it all begins.`,
}

const KINGDOM_TEXT = {
  title: 'The Kingdom of Siliconium',
  para: `What you mistook for copper traces are royal roads, carved in gold, 
  connecting every house of the kingdom. What you called chips are mighty 
  castles — each ruled by a house sworn to a single purpose. House Core thinks 
  and commands from its throne. House Volatile holds the kingdom's living memory. 
  House Render paints the world you see. House Eternal remembers everything, 
  forever. House Transit guards the gates to the outside world. Five houses. 
  One kingdom. Billions of decisions every second.`,
}

export default function TransformSection({ onTransformed }) {
  const sectionRef      = useRef()
  const imageWrapRef    = useRef()
  const buttonRef       = useRef()
  const flashRef        = useRef()
  const textRef       = useRef()
  const [transformed, setTransformed]   = useState(false)
  const [btnVisible,  setBtnVisible]    = useState(false)
  const [currentImage, setCurrentImage] = useState('motherboard')
  const [textContent,   setTextContent]   = useState(MOTHERBOARD_TEXT)

  // ── SCROLL TRIGGER — one scroll snap fires the whole zoom ──
  useEffect(() => {
    const section   = sectionRef.current
    const imageWrap = imageWrapRef.current

    // When user scrolls to this section,
    // the zoom plays automatically as a one-shot animation
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',      // fires when section is 80% into view
      once: true,            // only fires one time ever
      onEnter: () => {
        const tl = gsap.timeline({
          onComplete: () => {
            // Show the transform button
            setBtnVisible(true)
          }
        })

        gsap.fromTo(textRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
            )
        
        // Step 1 — zoom in toward motherboard
        tl.to(imageWrap, {
          scale: 1.35,
          duration: 2,
          ease: 'power1.in',
        })
      }
    })

    return () => trigger.kill()
  }, [])

  // ── TRANSFORM BUTTON CLICK ──
  const handleTransform = () => {
    const flash     = flashRef.current
    const imageWrap = imageWrapRef.current
    const btn       = buttonRef.current
    const text      = textRef.current

    // Hide button
    gsap.to(btn, { opacity: 0, scale: 0.8, duration: 0.3 })

    //fade out current text
    gsap.to(text, {
      opacity: 0,
      y: -10,
      duration: 0.3,
    })

    // Flash of golden light
    gsap.timeline()
      .to(flash, {
        opacity: 1,
        scale: 1.5,
        duration: 1.3,
        ease: 'power2.in',
      })
      .to(flash, {
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        onStart: () => {
          // Swap image at peak of flash
          setCurrentImage('kingdom')
          setTransformed(true)
          setTextContent(KINGDOM_TEXT)
        }
      })
      // Zoom back out to show full kingdom
      .to(imageWrap, {
        scale: 1.3,
        duration: 1,
        ease: 'power2.out',
      })
      // Fades in the text
      .to(text, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          if (onTransformed) onTransformed()
        }
      }, '-=0.5')
  }

  return (
    <div ref={sectionRef} style={styles.section}>
      <div style={styles.sticky}>

        {/* Flash */}
        <div ref={flashRef} style={styles.flash} />

        {/* Vignette */}
        <div style={styles.vignette} />

        {/* Top label */}
        <p style={styles.topLabel}>
          {transformed
            ? 'welcome to the Kingdom of Siliconium'
            : 'The silicon kingdom is ready to come to life'}
        </p>

        {/* Main layout — image left, text right */}
        <div style={styles.mainLayout}>

          {/* Left — Image */}
          <div style={styles.imageColumn}>
            <div ref={imageWrapRef} style={styles.imageWrap}>
              <img
                src={
                  currentImage === 'motherboard'
                    ? '/images/motherboard.png'
                    : '/images/kingdom.png'
                }
                alt={currentImage}
                style={styles.image}
              />

              {/* Glow under image */}
              <div style={{
                ...styles.imageGlow,
                background: transformed
                  ? 'radial-gradient(ellipse, rgba(201,168,76,0.15) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse, rgba(52,211,153,0.1) 0%, transparent 70%)',
              }} />
            </div>
          </div>

          {/* Right — Text */}
          <div style={styles.textColumn}>
            <div ref={textRef} style={{ opacity: 0 }}>

              {/* Title */}
              <h2 style={{
                ...styles.textTitle,
                color: transformed ? '#c9a84c' : '#c9a84c',
              }}>
                {textContent.title}
              </h2>

              {/* Paragraph */}
              <p style={styles.textPara}>
                {textContent.para}
              </p>

              {/* Transform button lives inside text column */}
              {btnVisible && !transformed && (
                <div
                  ref={buttonRef}
                  style={styles.btnWrapper}
                >
                  <button
                    onClick={handleTransform}
                    style={styles.btn}
                    onMouseEnter={e => {
                      e.currentTarget.style.background  = 'rgba(201,168,76,0.15)'
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color       = '#f0c040'
                      e.currentTarget.style.boxShadow   = '0 0 30px rgba(201,168,76,0.25)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background  = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                      e.currentTarget.style.color       = 'rgba(201,168,76,0.8)'
                      e.currentTarget.style.boxShadow   = 'none'
                    }}
                  >
                    ⚔ Transform into Kingdom
                  </button>
                  <p style={styles.btnSub}>
                    Click to awaken the Silicon Kingdom
                  </p>
                </div>
              )}

              {/* After transform — scroll prompt */}
              {transformed && (
                <div style={styles.scrollPrompt}>
                  <svg
                    width="16" height="16" viewBox="0 0 20 20"
                    fill="none"
                    style={{ animation: 'bounceDown 2s ease-in-out infinite' }}
                  >
                    <path
                      d="M10 3v14M4 11l6 6 6-6"
                      stroke="#c9a84c" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                  <span>Scroll to explore the kingdom</span>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

const styles = {
  section: {
    height: '100vh',          // normal height — no scroll needed
    background: '#00000a',
  },
  sticky: {
    position: 'sticky',
    top: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#00000a',
  },
  flash: {
    position: 'absolute',
    marginLeft: '-20vw',
    inset: 0,
    height: '100vh',
    width: '100vw',
    background: 'radial-gradient(circle at center, #f0c040 0%, #c9a84c 30%, transparent 70%)',
    opacity: 0,
    zIndex: 20,
    pointerEvents: 'none',
  },
  topLabel: {
    position: 'absolute',
    top: '5vh',
    left: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '5vh',
    transform: 'translateX(-50%)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(20px, 1.4vw, 11px)',
    letterSpacing: '0.3em',
    color: 'rgba(201, 168, 76, 0.88)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
  mainLayout: {
    position: 'relative',
    top: '5vh',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100vw',
    height: '80vh'
  },
  imageColumn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%',
    height: '100%',
  },
  imageWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    transformOrigin: 'center center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    borderRadius: 6,
  },
  textColumn: {
    marginTop: '-10%',
    display: 'flex',
    width: '40%',
    height: '40vh',
    flexWrap: 'wrap',
    alignItems: 'space-evenly'
  },
  textTitle: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    height: '6vh',
    width: '100%',
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(16px, 2vw, 24px)',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginBottom: 16,
    transition: 'color 0.5s ease',
    lineHeight: 1.3,
  },
  textPara: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    height: '26vh',
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(20px, 1.4vw, 17px)',
    lineHeight: 1.9,
    color: 'rgba(240,232,208,0.65)',
    fontStyle: 'italic',
    marginBottom: '10vh'
  },
  btnWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    height: '4vh',
    width: '100%',
    animation: 'fadeInUp 0.8s ease both',
  },
  btn: {
    alignSelf: 'flex-start',
    padding: '14px 36px',
    background: 'transparent',
    border: '1px solid rgba(201,168,76,0.4)',
    borderRadius: 2,
    color: 'rgba(201,168,76,0.8)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1vw, 12px)',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  btnSub: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    height: '4vh',
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(15px, 1.2vw, 14px)',
    fontStyle: 'italic',
    color: 'rgba(255, 191, 0, 0.75)',
    letterSpacing: '0.03em',
    marginTop: '2%',
  },
  scrollPrompt: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    height: '4vh',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    letterSpacing: '0.22em',
    color: 'rgba(201, 168, 76, 0.91)',
    textTransform: 'uppercase',
    animation: 'fadeInUp 0.6s ease both, pulse 2.4s ease-in-out 0.6s infinite',
  }
}