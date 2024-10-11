import { Line } from "@react-three/drei";
import React, { type FC, useMemo, useContext } from "react";
import { Vector3 } from "three";
import { AppContext } from "../App";
import type { IcoChunk } from "../board/Icosphere";
import { getCenter, lerpToward } from "../utils/mathUtils";
import { getColorForIndex } from "../utils/renderingUtils";
import { ArrayAttribute } from "./ArrayAttribute";
import { Label } from "./Label";

export const ChunkMesh: FC<{ chunk: IcoChunk }> = ({ chunk }) => {
  const { projectCoords } = useContext(AppContext);

  const { positions, colors, triCenters, chunkCenter } = useMemo(() => {
    const points = new Array<Vector3>();
    const triCenters = new Array<Vector3>();
    const chunkCenter = new Vector3();
    for (const tri of chunk.triangles) {
      if (!tri) continue;
      const p0 = projectCoords(tri.a.coords);
      const p1 = projectCoords(tri.b.coords);
      const p2 = projectCoords(tri.c.coords);
      if (Math.abs(p1.x - p0.x) > 0.8 || Math.abs(p2.x - p0.x) > 0.8) continue; // TODO: figure out wrapping
      points.push(
        ...[p0, p1, p2].map((p) => lerpToward(p, getCenter([p0, p1, p2]))),
      );
      chunkCenter.add(p0).add(p1).add(p2);
      triCenters.push(new Vector3().add(p0).add(p1).add(p2).divideScalar(3.0));
    }
    chunkCenter.divideScalar(points.length);

    const positions = new Float32Array(
      points.flatMap(({ x, y, z }) => [x, y, z]),
    );
    const colors = new Float32Array(
      points.flatMap(() => getColorForIndex(chunk.index) /*rgb.flat()*/),
    );
    return { positions, colors, points, triCenters, chunkCenter };
  }, [chunk, projectCoords]);

  //if (chunk.face.index === 0) console.log(chunk.index, chunk.tris);

  return positions.length === 0 ? null : (
    <>
      {false && <Line points={triCenters} lineWidth={4} />}
      {false &&
        chunk.triangles.map((tri) => {
          if (!tri) return null;
          const p0 = projectCoords(tri.a.coords);
          const p1 = projectCoords(tri.b.coords);
          const p2 = projectCoords(tri.c.coords);
          if (Math.abs(p1.x - p0.x) > 0.8 || Math.abs(p2.x - p0.x) > 0.8)
            return null;
          const center = new Vector3()
            .add(p0)
            .add(p1)
            .add(p2)
            .divideScalar(3.0);
          return (
            <Label key={tri.index} position={center}>
              t{tri.index}
            </Label>
          );
        })}
      {false && <Label position={chunkCenter}>c{chunk.index}</Label>}
      <mesh onPointerMove={(e) => console.log(e.face, e.faceIndex, e)}>
        <bufferGeometry>
          <ArrayAttribute attribute="position" array={positions} itemSize={3} />
          <ArrayAttribute attribute="color" array={colors} itemSize={3} />
        </bufferGeometry>
        <meshBasicMaterial
          vertexColors={true}
          transparent={true}
          polygonOffset={true}
          polygonOffsetFactor={10}
          polygonOffsetUnits={10}
        />
      </mesh>
      <mesh>
        <bufferGeometry>
          <ArrayAttribute attribute="position" array={positions} itemSize={3} />
        </bufferGeometry>
        <meshBasicMaterial wireframe={true} color={"black"} />
      </mesh>
    </>
  );
};
