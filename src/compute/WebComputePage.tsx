import { Canvas } from "@react-three/fiber";
import React, { type FC, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import BasePage from "../components/BasePage";
import { RotatingBox } from "../components/RotatingBox";
import { ComputeLayer } from "./ComputeLayer";
import type { ComputeBuffers } from "./computeBuffers";
import { useInitializeBuffer } from "./workers/useInitializeBuffer";

export const WebComputePage = () => {
  //----------------------------------------------------------------------------

  const [renderer, setRenderer] = useState<WebGPURenderer>();
  const buffer0 = useInitializeBuffer();
  const buffer1 = useInitializeBuffer();

  const computeParams = useMemo(
    () =>
      !renderer || !buffer0 || !buffer1
        ? undefined
        : { renderer, buffer0, buffer1 },
    [renderer, buffer0, buffer1],
  );

  return (
    <BasePage>
      <Canvas
        frameloop={renderer ? "always" : "never"}
        gl={(canvas) => {
          const renderer = new WebGPURenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: true,
          });
          renderer.init().then(() => setRenderer(renderer));
          return renderer;
        }}
      >
        <RotatingBox />
        {computeParams && <ComputeLayer {...computeParams} />}
        {computeParams && <Scene {...computeParams} />}
      </Canvas>
    </BasePage>
  );
};

export const Scene: FC<ComputeBuffers> = ({ buffer1 }) => {
  const ref = useRef<THREE.BufferGeometry>(
    (() => new THREE.BufferGeometry())(),
  );

  useEffect(() => {
    ref.current.setAttribute("position", buffer1);
    ref.current.boundingBox = new THREE.Box3(
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(1, 1, 1),
    );
    ref.current.boundingSphere = new THREE.Sphere(undefined, 1);
  }, [buffer1]);

  return (
    <mesh>
      <bufferGeometry ref={ref} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </mesh>
  );
};
