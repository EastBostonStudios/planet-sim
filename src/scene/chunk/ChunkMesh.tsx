import { Line } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { type FC, useMemo, useContext } from "react";
import { Vector2, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils";
import { AppContext } from "../../App";
import { xyzToLatLng } from "../../board/Icosahedron";
import type { IcoChunk, IcoCoords } from "../../board/Icosphere";
import { interpolateOnFace } from "../../utils/mathUtils";
import { getColorForIndex } from "../../utils/renderingUtils";
import { ArrayAttribute } from "../ArrayAttribute";
import { Label } from "../Label";
import frag from "./chunk.frag";
import vert from "./chunk.vert";

const wrapRightToLeft = (x: number, doWrap: boolean) =>
  doWrap && x > 0 ? x - 360.0 : x;

export const ChunkMesh: FC<{ chunk: IcoChunk }> = ({ chunk }) => {
  const { is3D } = useContext(AppContext);
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

  const { positions, uvs, colors, triCenters, chunkCenter, regionIDs } =
    useMemo(() => {
      const points = new Array<Vector3>();
      const uvArr = new Array<Vector2>();
      const triCenters = new Array<Vector3>();
      const chunkCenter = new Vector3();
      const projectCoords = (coords: IcoCoords) =>
        interpolateOnFace(
          coords.face.a.coords3D,
          coords.face.b.coords3D,
          coords.face.c.coords3D,
          coords.x,
          coords.y,
        );
      for (const tri of chunk.triangles) {
        if (!tri) continue;

        const p0 = projectCoords(tri.a.coords).normalize();
        const p1 = projectCoords(tri.b.coords).normalize();
        const p2 = projectCoords(tri.c.coords).normalize();
        const a = xyzToLatLng(p0);
        const b = xyzToLatLng(p1);
        const c = xyzToLatLng(p2);

        if (is3D) {
          points.push(p0, p1, p2);
          uvArr.push(a, b, c);
        } else {
          const doesWrap =
            Math.max(a.x, b.x, c.x) - Math.min(a.x, b.x, c.x) > 180.0;

          const thetaA = degToRad(wrapRightToLeft(a.x, doesWrap));
          const thetaB = degToRad(wrapRightToLeft(b.x, doesWrap));
          const thetaC = degToRad(wrapRightToLeft(c.x, doesWrap));

          const phiA = degToRad(a.y);
          const phiB = degToRad(b.y);
          const phiC = degToRad(c.y);

          uvArr.push(
            new Vector2(wrapRightToLeft(a.x, doesWrap), a.y),
            new Vector2(wrapRightToLeft(b.x, doesWrap), b.y),
            new Vector2(wrapRightToLeft(c.x, doesWrap), c.y),
          );
          points.push(
            new Vector3(thetaA * Math.cos(phiA), phiA, 0.0),
            new Vector3(thetaB * Math.cos(phiB), phiB, 0.0),
            new Vector3(thetaC * Math.cos(phiC), phiC, 0.0),
          );
          if (doesWrap) {
            uvArr.push(
              new Vector2(wrapRightToLeft(a.x, doesWrap) + 360.0, a.y),
              new Vector2(wrapRightToLeft(b.x, doesWrap) + 360.0, b.y),
              new Vector2(wrapRightToLeft(c.x, doesWrap) + 360.0, c.y),
            );
            points.push(
              new Vector3((thetaA + 2.0 * Math.PI) * Math.cos(phiA), phiA, 0.0),
              new Vector3((thetaB + 2.0 * Math.PI) * Math.cos(phiB), phiB, 0.0),
              new Vector3((thetaC + 2.0 * Math.PI) * Math.cos(phiC), phiC, 0.0),
            );
          }
        }
      }
      // chunkCenter.divideScalar(points.length);

      const positions = new Float32Array(
        points.flatMap(({ x, y, z }) => [x, y, z]),
      );
      const uvs = new Float32Array(uvArr.flatMap(({ x, y }) => [x, y]));
      const colors = new Float32Array(
        points.flatMap(() => getColorForIndex(chunk.index)),
      );
      const regionIDs = new Float32Array(points.flatMap(() => 0));
      return {
        positions,
        uvs,
        colors,
        points,
        triCenters,
        chunkCenter,
        regionIDs,
      };
    }, [chunk, is3D]);

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
          <ArrayAttribute attribute="uv" array={uvs} itemSize={2} />
          {false && (
            <ArrayAttribute attribute="color" array={colors} itemSize={3} />
          )}
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
      {
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
      }
    </>
  );
};
