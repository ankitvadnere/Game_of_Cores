export default function TitleSection() {
  return (
    <div style={styles.wrapper}>

      <video
        src="/videos/Intro.mp4"
        style={styles.video}
        autoPlay
        muted
        playsInline
      />

    </div>
  )
}

const styles = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    background: '#00000a',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: 'auto',
    objectFit: 'cover',    // fills the screen without stretching
    margin: 'auto'
  },
}