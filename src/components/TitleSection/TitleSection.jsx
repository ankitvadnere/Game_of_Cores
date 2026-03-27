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
    width: '100vw',
    height: '100vh',
    background: '#00000a',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',    // fills the screen without stretching
  },
}