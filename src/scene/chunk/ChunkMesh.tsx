import { Line } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { type FC, useMemo, useContext } from "react";
import { Vector2, Vector3 } from "three";
import { AppContext } from "../../App";
import type { IcoChunk } from "../../board/Icosphere";
import { getColorForIndex } from "../../utils/renderingUtils";
import { ArrayAttribute } from "../ArrayAttribute";
import { Label } from "../Label";

import frag from "./chunk.frag";
import vert from "./chunk.vert";

export const ChunkMesh: FC<{ chunk: IcoChunk }> = ({ chunk }) => {
  const { projectCoords } = useContext(AppContext);
  const { show, showOrder, showIndices } = useControls({
    chunks: folder({
      show: true,
      showOrder: false,
      showIndices: false,
    }),
  });

  // onPointerMove={(e) => console.log(e.face, e.faceIndex, e)}

  const uniforms = React.useMemo(
    () => ({
      v_face_a: { value: new Vector3() },
      v_face_b: { value: new Vector3() },
      v_face_c: { value: new Vector3() },
      v_face_a_2d: { value: new Vector2() },
      v_face_b_2d: { value: new Vector2() },
      v_face_c_2d: { value: new Vector2() },
    }),
    [],
  );

  React.useEffect(() => {
    uniforms.v_face_a.value = chunk.face.a.coords3D;
    uniforms.v_face_b.value = chunk.face.b.coords3D;
    uniforms.v_face_c.value = chunk.face.c.coords3D;
    uniforms.v_face_a_2d.value = chunk.face.a.lngLat;
    uniforms.v_face_b_2d.value = chunk.face.b.lngLat;
    uniforms.v_face_c_2d.value = chunk.face.c.lngLat;
  }, [chunk, uniforms]);

  const { positions, colors, triCenters, chunkCenter, regionIDs } =
    useMemo(() => {
      const points = new Array<Vector3>();
      const triCenters = new Array<Vector3>();
      const chunkCenter = new Vector3();
      for (const tri of chunk.triangles) {
        if (!tri) continue;
        const p0 = new Vector3(tri.a.coords.x, tri.a.coords.y, 0.0);
        const p1 = new Vector3(tri.b.coords.x, tri.b.coords.y, 0.0);
        const p2 = new Vector3(tri.c.coords.x, tri.c.coords.y, 0.0);
        points.push(p0, p1, p2);
        chunkCenter.add(p0).add(p1).add(p2);
        triCenters.push(
          new Vector3().add(p0).add(p1).add(p2).divideScalar(3.0),
        );
      }
      chunkCenter.divideScalar(points.length);

      const positions = new Float32Array(
        points.flatMap(({ x, y, z }) => [x, y, z]),
      );
      const colors = new Float32Array(
        points.flatMap(() => getColorForIndex(chunk.index)),
      );
      const regionIDs = new Float32Array(points.flatMap(() => 0));
      return { positions, colors, points, triCenters, chunkCenter, regionIDs };
    }, [chunk]);

  //if (chunk.face.index === 0) console.log(chunk.index, chunk.tris);

  return !show || positions.length === 0 ? null : (
    <>
      {<Label position={chunkCenter}>c{chunk.index}</Label>}
      {showOrder && <Line points={triCenters} lineWidth={4} />}
      {showIndices &&
        chunk.triangles.map((tri) => {
          if (!tri) return null;
          const p0 = tri.a.coords;
          const p1 = tri.b.coords;
          const p2 = tri.c.coords;
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
      <mesh>
        <bufferGeometry>
          <ArrayAttribute attribute="position" array={positions} itemSize={3} />
          <ArrayAttribute attribute="color" array={colors} itemSize={3} />
          <ArrayAttribute
            attribute="region_id"
            array={regionIDs}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
        />
      </mesh>
      {false && (
        <mesh>
          <bufferGeometry>
            <ArrayAttribute
              attribute="position"
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          {<meshBasicMaterial wireframe={true} color={"black"} />}
        </mesh>
      )}
    </>
  );
};
