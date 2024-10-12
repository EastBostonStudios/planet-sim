import { Line } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { type FC, useMemo, useContext } from "react";
import { Vector2, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils";
import { AppContext } from "../../App";
import type { IcoChunk } from "../../board/Icosphere";
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
    uniforms.v_face_a.value = chunk.face.a.xyz;
    uniforms.v_face_b.value = chunk.face.b.xyz;
    uniforms.v_face_c.value = chunk.face.c.xyz;
    uniforms.v_face_a_2d.value = chunk.face.a.lngLat;
    uniforms.v_face_b_2d.value = chunk.face.b.lngLat;
    uniforms.v_face_c_2d.value = chunk.face.c.lngLat;
  }, [chunk, uniforms]);

  const { positions, lngLats, colors, triCenters, chunkCenter, regionIDs } =
    useMemo(() => {
      const xyz2DArr = new Array<Vector3>();
      const xyz3DArr = new Array<Vector3>();
      const lngLatArr = new Array<Vector2>();
      for (const tri of chunk.triangles) {
        if (!tri) continue;

        const doesWrap =
          Math.max(tri.a.lngLat.x, tri.b.lngLat.x, tri.c.lngLat.x) -
            Math.min(tri.a.lngLat.x, tri.b.lngLat.x, tri.c.lngLat.x) >
          180.0;

        const thetaA = degToRad(wrapRightToLeft(tri.a.lngLat.x, doesWrap));
        const thetaB = degToRad(wrapRightToLeft(tri.b.lngLat.x, doesWrap));
        const thetaC = degToRad(wrapRightToLeft(tri.c.lngLat.x, doesWrap));

        const phiA = degToRad(tri.a.lngLat.y);
        const phiB = degToRad(tri.b.lngLat.y);
        const phiC = degToRad(tri.c.lngLat.y);

        if (is3D) {
          xyz3DArr.push(tri.a.xyz, tri.b.xyz, tri.c.xyz);
        } else {
          xyz3DArr.push(
            new Vector3(thetaA * Math.cos(phiA), phiA, 0.0),
            new Vector3(thetaB * Math.cos(phiB), phiB, 0.0),
            new Vector3(thetaC * Math.cos(phiC), phiC, 0.0),
          );
        }
        lngLatArr.push(
          new Vector2(
            wrapRightToLeft(tri.a.lngLat.x, doesWrap),
            tri.a.lngLat.y,
          ),
          new Vector2(
            wrapRightToLeft(tri.b.lngLat.x, doesWrap),
            tri.b.lngLat.y,
          ),
          new Vector2(
            wrapRightToLeft(tri.c.lngLat.x, doesWrap),
            tri.c.lngLat.y,
          ),
        );

        if (doesWrap && !is3D) {
          xyz3DArr.push(
            new Vector3((thetaA + 2.0 * Math.PI) * Math.cos(phiA), phiA, 0.0),
            new Vector3((thetaB + 2.0 * Math.PI) * Math.cos(phiB), phiB, 0.0),
            new Vector3((thetaC + 2.0 * Math.PI) * Math.cos(phiC), phiC, 0.0),
          );
          lngLatArr.push(
            new Vector2(
              wrapRightToLeft(tri.a.lngLat.x, doesWrap) + 360.0,
              tri.a.lngLat.y,
            ),
            new Vector2(
              wrapRightToLeft(tri.b.lngLat.x, doesWrap) + 360.0,
              tri.b.lngLat.y,
            ),
            new Vector2(
              wrapRightToLeft(tri.c.lngLat.x, doesWrap) + 360.0,
              tri.c.lngLat.y,
            ),
          );
        }
      }
      // chunkCenter.divideScalar(points.length);

      const positions = new Float32Array(
        xyz3DArr.flatMap(({ x, y, z }) => [x, y, z]),
      );
      const lngLats = new Float32Array(lngLatArr.flatMap(({ x, y }) => [x, y]));
      const colors = new Float32Array(
        xyz3DArr.flatMap(() => getColorForIndex(chunk.index)),
      );

      const regionIDs = new Float32Array(xyz3DArr.flatMap(() => 0));
      const triCenters = new Array<Vector3>();
      const chunkCenter = new Vector3();
      return {
        positions,
        lngLats,
        colors,
        points: xyz3DArr,
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
          <ArrayAttribute attribute="lng_lat" array={lngLats} itemSize={2} />
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
