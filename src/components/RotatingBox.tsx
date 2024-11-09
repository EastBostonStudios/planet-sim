import { useFrame } from "@react-three/fiber";
import React, { type FC, useRef } from "react";
import type { Mesh } from "three";

export const RotatingBox: FC = () => {
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotateX(0.001);
      ref.current.rotateY(0.005);
      ref.current.rotateZ(0.003);
    }
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.2, 0.2, 0.5]} />
      <meshBasicMaterial color={"hotpink"} />
    </mesh>
  );
};
