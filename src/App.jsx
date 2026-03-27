import { useState } from 'react'
import './index.css'
import TitleSection from './components/TitleSection/TitleSection'
import TransformSection from './components/TransformSection/TransformSection'
import HouseSection from './components/HouseSection/HouseSection'
import HouseCore from './components/HouseCore/HouseCore'
import HouseVolatile from './components/HouseVolatile/HouseVolatile'
import HouseRender from './components/HouseRender/HouseRender'
import HouseEternal from './components/HouseEternal/HouseEternal'
import HouseTransit, { VictoryScreen } from './components/HouseTransit/HouseTransit'

function App() {
  const [transformed, setTransformed] = useState(false)
  const [coreComplete,     setCoreComplete]     = useState(false)
  const [volatileComplete, setVolatileComplete] = useState(false)
  const [renderComplete, setRenderComplete] = useState(false)
  const [eternalComplete, setEternalComplete] = useState(false)
  const [transitComplete, setTransitComplete] = useState(false)

  return (
    <div style={{ background: '#00000a', minHeight: '100vh' }}>
      <TitleSection />
      <TransformSection onTransformed={() => setTransformed(true)} />
      {transformed && ( <HouseSection /> )}
      {transformed && ( <HouseCore onComplete={() => setCoreComplete(true)} /> )}
      {coreComplete && ( <HouseVolatile onComplete={() => setVolatileComplete(true)} /> )}
      {volatileComplete && ( <HouseRender onComplete={() => setRenderComplete(true)} /> )}
      {renderComplete && ( <HouseEternal onComplete={() => setEternalComplete(true)} /> )}
      {eternalComplete && ( <HouseTransit onComplete={() => setTransitComplete(true)} />)}
      {transitComplete && <VictoryScreen />}
    </div>
  )
}

export default App