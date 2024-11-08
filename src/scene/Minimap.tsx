import React, { useRef, type FC } from "react";
import { type BufferAttribute, BufferGeometry } from "three";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import frag from "./chunk/chunk.frag";
import vert from "./chunk/chunk.vert";

export const Minimap: FC<
  {
    tilePositionAttribute: BufferAttribute;
    indices: Uint32Array;
  } & Omit<CanvasProps, "children">
> = ({ tilePositionAttribute, indices, ...rest }) => {
  //----------------------------------------------------------------------------

  const ref = useRef(new BufferGeometry());
  React.useEffect(() => {
    ref.current.setAttribute("position", tilePositionAttribute);
  }, [tilePositionAttribute]);

  const uniforms = React.useMemo(
    () => ({
      v_time: { value: 0.0 },
    }),
    [],
  );

  return (
    <Canvas {...rest}>
      <mesh onPointerMove={(e) => console.log(e.face?.a)}>
        <bufferGeometry ref={ref}>
          <bufferAttribute
            attach="index"
            array={indices}
            count={indices.length}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
        />
      </mesh>
    </Canvas>
  );
};
