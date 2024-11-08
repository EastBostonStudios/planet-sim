import { Canvas, useFrame } from "@react-three/fiber";
import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import * as THREE_WEBGPU from "three/webgpu";

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

  /*const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    init().then(render);
  }, []);*/

  //----------------------------------------------------------------------------

  const [isInitialized, setIsInitialized] = useState(false);

  return (
    <StyledApp>
      <Canvas
        gl={(canvas) => {
          const renderer = new THREE_WEBGPU.WebGPURenderer({
            canvas,
            antialias: true,
          });
          renderer.init().then(() => setIsInitialized(true));
          return renderer;
        }}
      >
        <RotatingBox />
        {isInitialized && <Scene />}
      </Canvas>
    </StyledApp>
  );
};

const RotatingBox = () => {
  const ref = useRef<THREE_WEBGPU.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotateX(0.001);
      ref.current.rotateY(0.005);
      ref.current.rotateZ(0.003);
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={"hotpink"} />
    </mesh>
  );
};

const Scene = () => {
  const positionBuffer = useMemo(
    () =>
      new THREE_WEBGPU.StorageBufferAttribute(
        new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0]),
        3,
      ),
    [],
  );

  const { computePositions, time } = useMemo(() => {
    // @builtin(global_invocation_id)
    const computeShader = THREE_WEBGPU.wgslFn(`
      fn compute(
        positionBuffer: ptr<storage, array<vec3<f32>>, read_write>,
        time: f32
      ) -> void {
        (*positionBuffer)[instanceIndex] = (*positionBuffer)[instanceIndex] + 0.01 * vec3(1.0, 1.0, 1.0) * sin(time);
      }
    `);

    const time = THREE_WEBGPU.uniform(0);
    const computeShaderParams = {
      positionBuffer: THREE_WEBGPU.storage(
        positionBuffer,
        "vec3",
        positionBuffer.count,
      ),
      time,
    };

    return {
      computePositions: computeShader(computeShaderParams).compute(4, [64]),
      time,
    };
  }, [positionBuffer]);

  const ref = useRef<THREE_WEBGPU.BufferGeometry>(null);

  useLayoutEffect(() => {
    ref.current!.setAttribute("position", positionBuffer);
  }, [ref]);

  useFrame(({ gl }) => {
    time.value = performance.now() / 1000;
    (gl as THREE.WebGPURenderer).compute(computePositions);
  });

  return (
    <mesh>
      <bufferGeometry ref={ref} />
      <meshBasicMaterial />
    </mesh>
  );
};

export default App2;

/*

 */
