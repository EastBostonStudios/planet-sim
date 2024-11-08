import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import styled from "styled-components";
import type { InstancedMesh } from "three";
import * as THREE from "three/webgpu";
import { init, render } from "./test";

const StyledApp = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: darkslategray;
`;

/*const particleCount = 1000;

const createBuffer = () =>
  storage(
    new THREE.StorageInstancedBufferAttribute(particleCount, 3),
    "vec3",
    particleCount,
  );
const buffer = createBuffer();

const computeUpdate = Fn(() => {
  const position = positionBuffer.element(instanceIndex);
  const velocity = velocityBuffer.element(instanceIndex);

  velocity.addAssign(vec3(0.0, gravity, 0.0));
  position.addAssign(velocity);

  velocity.mulAssign(friction);

  // floor

  If(position.y.lessThan(0), () => {
    position.y = 0;
    velocity.y = velocity.y.negate().mul(bounce);

    // floor friction

    velocity.x = velocity.x.mul(0.9);
    velocity.z = velocity.z.mul(0.9);
  });
});

computeParticles = computeUpdate().compute(particleCount);*/

export const App2 = () => {
  //----------------------------------------------------------------------------

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    init().then(render);
  }, []);

  //----------------------------------------------------------------------------

  return <StyledApp></StyledApp>;
};

export default App2;

/*
<Canvas
        gl={(canvas) => {
          const renderer = new THREE.WebGPURenderer({ canvas });
          renderer.init();
          return renderer;
        }}
      >
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={"hotpink"} />
        </mesh>
        <instancedMesh ref={ref} args={[undefined, undefined, 1]}>
          {false && <boxGeometry args={[1, 1, 1]} />}
          <meshNormalMaterial />
        </instancedMesh>
      </Canvas>
 */
