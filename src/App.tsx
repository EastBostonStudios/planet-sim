import * as React from "react";

import styled from "styled-components";

import {
  Grid,
  MapControls,
  OrbitControls,
  PerspectiveCamera,
  Stats,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createContext } from "react";
import { useSearchParams } from "react-router-dom";
import { DoubleSide } from "three";
import { distBetweenPoints } from "./icosphere/Icosahedron";
import { Scene } from "./icosphere/Scene";

const StyledApp = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: darkslategray;
`;

const StyledTopBar = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  z-index: 999;
`;

const StyledToolbar = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  color: white;
`;

const StyledButtonHolder = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

const minResolution = 0;
const maxResolution = 8;
const defaultResolution = 1;

export const AppContext = createContext<{ is3D: boolean }>({ is3D: false });

const App = () => {
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const resolution = React.useMemo(() => {
    const param = searchParams.get("resolution");
    if (Number.isNaN(param)) return defaultResolution;
    return Math.min(maxResolution, Math.max(minResolution, Number(param)));
  }, [searchParams]);
  const [is3D, setIs3D] = React.useState(false);

  return (
    <AppContext.Provider value={{ is3D }}>
      <StyledApp className="App">
        <StyledTopBar>
          <StyledToolbar>
            <h4>Resolution: {resolution}</h4>
            <input
              type="range"
              min={minResolution}
              max={maxResolution}
              value={resolution}
              onChange={(e) =>
                setSearchParams({
                  resolution: e.target.value,
                })
              }
            />
            <StyledButtonHolder>
              <button type="button" onClick={() => setIs3D((prev) => !prev)}>
                {is3D ? "3D" : "2D"}
              </button>
            </StyledButtonHolder>
          </StyledToolbar>
        </StyledTopBar>
        <Canvas>
          <Stats />
          <directionalLight rotation={[45, 45, 45]} />
          {is3D ? (
            <group key="3D">
              <axesHelper args={[5]} />
              <OrbitControls />
              <PerspectiveCamera makeDefault position={[-3, 0, 1]} />
              <Scene resolution={resolution} />
            </group>
          ) : (
            <group key="2D">
              <MapControls />
              <PerspectiveCamera
                makeDefault
                position={[0, 6, 0]}
                rotation={[Math.PI / 2.0, 0, 0]}
              />
              <group
                position={[
                  -distBetweenPoints * 1.75,
                  0,
                  distBetweenPoints * 1.25,
                ]}
                rotation={[-Math.PI / 2.0, 0, 0]}
              >
                <Scene resolution={resolution} />
              </group>
              <Grid
                position={[0, 0.01, 0]}
                side={DoubleSide}
                cellSize={0.1}
                cellColor="grey"
                sectionColor="grey"
                infiniteGrid={true}
                followCamera={true}
              />
            </group>
          )}
        </Canvas>
      </StyledApp>
    </AppContext.Provider>
  );
};

export default App;
