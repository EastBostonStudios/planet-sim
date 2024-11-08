import { useFrame } from "@react-three/fiber";
import React, { useContext, type FC } from "react";
import { type BufferAttribute, BufferGeometry } from "three";

import { AppContext } from "../App";
import frag from "./chunk/chunk.frag";
import vert from "./chunk/chunk.vert";

const vert3D = `${vert}`.replace("#define IS_3D 0", "#define IS_3D 1");

export const MainMap: FC<{
  tilePositionAttribute: BufferAttribute;
  indices: Uint32Array;
}> = ({ tilePositionAttribute, indices }) => {
  //----------------------------------------------------------------------------

  const { is3D } = useContext(AppContext);
  const ref = React.useRef(new BufferGeometry());
  React.useEffect(() => {
    ref.current.setAttribute("position", tilePositionAttribute);
  }, [tilePositionAttribute]);

  const uniforms = React.useMemo(
    () => ({
      v_time: { value: 0.0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    uniforms.v_time.value += delta;
  });

  return (
    <mesh
      rotation={is3D ? undefined : [-Math.PI / 2.0, 0, 0]}
      onPointerMove={(e) => console.log(e.face?.a)}
    >
      <bufferGeometry ref={ref}>
        <bufferAttribute
          attach="index"
          array={indices}
          count={indices.length}
          itemSize={1}
        />
      </bufferGeometry>
      {is3D ? (
        <shaderMaterial
          key={4321}
          uniforms={uniforms}
          vertexShader={vert3D}
          fragmentShader={frag}
        />
      ) : (
        <shaderMaterial
          key={1234}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
        />
      )}
    </mesh>
  );
};
