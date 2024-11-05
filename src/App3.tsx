import {
  Bounds,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import React from "react";
import { Color } from "three";
import {
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
} from "three/examples/jsm/nodes/Nodes.js";

import WebGPUCapabilities from "three/examples/jsm/capabilities/WebGPU";

import WebGPURenderer from "three/examples/jsm/renderers/webgpu/WebGPURenderer";

extend({ MeshBasicNodeMaterial, MeshStandardNodeMaterial });

const adsf = new GLTFLoader();
/*
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshBasicNodeMaterial: any;
      meshStandardNodeMaterial: any;
    }
  }
}
 */

export default function App() {
  return (
    <>
      <Canvas
        gl={(canvas) => new WebGPURenderer({ canvas })}
        camera={{ fov: 50, position: [0, 300, -85] }}
        onCreated={(state) => {
          const gl = state.gl as WebGPURenderer;
          gl.init().then(() => {
            gl.setClearColor(new Color(0, 0, 0), 0);
          });
        }}
      >
        <OrbitControls makeDefault autoRotate />
        <PerspectiveCamera position={[2, 1, 2]} makeDefault />

        <Environment files={"/venice_sunset_1k (1).hdr"} />
        <ambientLight intensity={0.5} />

        <Bounds fit clip observe margin={1.3}>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={"hotpink"} />
          </mesh>
        </Bounds>
      </Canvas>
    </>
  );
}
