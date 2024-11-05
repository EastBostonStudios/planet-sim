import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import styled from "styled-components";
import type { InstancedMesh } from "three";
import { foo } from "./shaderTest/webComputeTest";

const StyledApp = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: darkslategray;
`;

export const App2 = () => {
  //----------------------------------------------------------------------------

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  useEffect(() => {
    foo().then(console.log);
  }, []);

  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    //ref.current.set;
  }, []);

  //----------------------------------------------------------------------------

  return (
    <StyledApp>
      <Canvas>
        <instancedMesh ref={ref} args={[undefined, undefined, 1]}>
          {false && <cubeBufferGeometry args={[1, 1, 1]} />}
          <meshNormalMaterial />
        </instancedMesh>
      </Canvas>
    </StyledApp>
  );
};

export default App2;
