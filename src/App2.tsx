import { Canvas, useFrame } from "@react-three/fiber";
import React, {
  type FC,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import * as THREE_WEBGPU from "three/webgpu";
import computePositionsShader from "./scene/chunk/computePositions.wgsl";
import computePositions2Shader from "./scene/chunk/computePositions2.wgsl";
import MyWorker from "./scene/setup.worker?worker";

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

  const [frameLoop, setFrameLoop] = useState<"never" | "always">("never");
  const [positionBuffer, setPositionBuffer] =
    useState<THREE_WEBGPU.StorageBufferAttribute>();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  useEffect(() => {
    const worker = new MyWorker();
    worker.onmessage = async (message) => {
      worker.terminate();
      console.log(message.data);
      setPositionBuffer(
        new THREE_WEBGPU.StorageBufferAttribute(message.data, 3),
      );
    };
    worker.onerror = async (error) => {
      worker.terminate();
      console.error(error);
    };
    worker.postMessage({});
    return;
  }, []);

  return (
    <StyledApp>
      <Canvas
        frameloop={frameLoop}
        gl={(canvas) => {
          const renderer = new THREE_WEBGPU.WebGPURenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: true,
          });
          renderer.init().then(() => setFrameLoop("always"));
          return renderer;
        }}
      >
        {positionBuffer && <Scene positionBuffer={positionBuffer} />}
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
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color={"hotpink"} />
    </mesh>
  );
};

const Scene: FC<{ positionBuffer: THREE_WEBGPU.StorageBufferAttribute }> = ({
  positionBuffer,
}) => {
  const params = useMemo(() => {
    const position_buffer = THREE_WEBGPU.storage(
      positionBuffer,
      "vec3",
      positionBuffer.count,
    );
    const time = THREE_WEBGPU.uniform(0);
    return {
      position_buffer,
      time,
    };
  }, [positionBuffer]);

  const { computePositions, computePositions2 } = useMemo(() => {
    // @builtin(global_invocation_id)
    const computeShader = THREE_WEBGPU.wgslFn(computePositionsShader);
    const compute2Shader = THREE_WEBGPU.wgslFn(computePositions2Shader);

    const call = computeShader(params);
    const compute = call.compute(positionBuffer.count, [64]);
    return {
      computePositions: compute,
      computePositions2: compute2Shader(params).compute(
        positionBuffer.count,
        [64],
      ),
    };
  }, [params, positionBuffer.count]);

  const ref = useRef<THREE_WEBGPU.BufferGeometry>(null);

  useLayoutEffect(() => {
    ref.current!.setAttribute("position", positionBuffer);
  }, [positionBuffer]);

  const computeCommands = useMemo(
    () => [
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
      computePositions,
      computePositions2,
    ],
    [computePositions, computePositions2],
  );

  useFrame(({ gl, clock }) => {
    params.time.value = clock.elapsedTime;
    (gl as THREE_WEBGPU.WebGPURenderer).compute(computeCommands);
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
