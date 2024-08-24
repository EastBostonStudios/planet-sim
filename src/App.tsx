import * as React from 'react'

import styled from 'styled-components'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

const StyledApp = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: darkslategray;
`

const App = () => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'scroll'
    }
  }, [])

  return (
    <StyledApp className='App'>
      <input type='range' min='1' max='100' value='50' />
      <Canvas>
        <OrbitControls/>
        <directionalLight rotation={[45, 45, 45]}/>
        <ambientLight/>
        <mesh>
          <boxGeometry args={[1, 1, 1]}/>
          <meshStandardMaterial color="#6be092"/>
        </mesh>
      </Canvas>
    </StyledApp>
  )
}

export default App
