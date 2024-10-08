import { Line } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { type FC, Fragment, useContext, useMemo } from "react";
import { Vector3 } from "three";
import { AppContext } from "../App";
import { Icosphere } from "../board/Icosphere";
import { getShapeName, validateBoard } from "../board/boardHelpers";
import { getCenter, lerpToward } from "../utils/mathUtils";
import { getColorForIndex } from "../utils/renderingUtils";
import { IcoMeshes } from "./IcoMeshes";
import { Label } from "./Label";

const ArrayAttribute: FC<{
  attribute: string;
  array: Float32Array;
  itemSize: number;
}> = ({ attribute, array, itemSize }) => {
  return (
    <bufferAttribute
      attach={`attributes-${attribute}`}
      array={array}
      count={array.length / itemSize}
      itemSize={itemSize}
    />
  );
};

export const Scene: FC<{ icosphereSize: number }> = ({ icosphereSize }) => {
  //----------------------------------------------------------------------------

  const { projectCoords, projectCoordsArray } = useContext(AppContext);
  const { doSwap, showTiles, showTileIndices, showChunks } = useControls({
    tiles: folder({
      doSwap: true,
      showTiles: true,
      showTileIndices: false,
      showChunks: false,
    }),
  });

  const { tiles, chunks } = useMemo(() => {
    const board = new Icosphere(icosphereSize, doSwap);
    validateBoard(board);
    return board;
  }, [icosphereSize, doSwap]);

  //----------------------------------------------------------------------------

  return (
    <Fragment key={`${icosphereSize} ${doSwap}`}>
      {showTiles &&
        tiles.map((tile) => {
          const [tilePosition, ...coords] = projectCoordsArray(
            [tile.coords].concat(
              tile.neighbors
                .map((neighbor) => neighbor?.coords)
                .filter((coords) => !!coords),
            ),
          );
          const points = coords.map((point) =>
            lerpToward(tilePosition, point, 0.45),
          );
          const vec =
            points.length >= 2
              ? new Vector3()
                  .crossVectors(
                    new Vector3().subVectors(
                      points[0].clone().normalize(),
                      tilePosition.clone().normalize(),
                    ),
                    new Vector3().subVectors(
                      points[1].clone().normalize(),
                      tilePosition.clone().normalize(),
                    ),
                  )
                  .normalize()
              : undefined;

          const positions = points
            .flatMap((p, i) => [
              //tilePosition,
              ///p,
              tilePosition,
              p,
              points[(i + 1) % points.length],
            ])
            .flatMap(({ x, y, z }) => [x, y, z]);
          const colors = points.flatMap((_) =>
            [
              [1, 0, 0],
              [0, 1, 0],
              [0, 0, 1],
            ].flat(),
          );

          return (
            <group key={tile.index}>
              <mesh>
                <bufferGeometry>
                  <ArrayAttribute
                    attribute="position"
                    array={new Float32Array(positions)}
                    itemSize={3}
                  />
                  <ArrayAttribute
                    attribute="color"
                    array={new Float32Array(colors)}
                    itemSize={3}
                  />
                </bufferGeometry>
                <meshBasicMaterial
                  vertexColors={true}
                  transparent={true}
                  polygonOffset={true}
                  polygonOffsetFactor={10}
                  polygonOffsetUnits={10}
                />
              </mesh>
              {showTileIndices && (
                <Label position={tilePosition}>
                  {getShapeName(tile.shape)}
                </Label>
              )}
              {!vec ? null : (
                <Line
                  points={[
                    tilePosition,
                    new Vector3().copy(tilePosition).addScaledVector(vec, 0.05),
                  ]}
                />
              )}
              {points.length > 0 && (
                <Line
                  points={points.flatMap((p, i) => [
                    //tilePosition,
                    ///p,
                    p,
                    points[(i + 1) % points.length],
                  ])}
                  vertexColors={points.flatMap((_, i) => [
                    getColorForIndex(tile.index + i + 5),
                    getColorForIndex(tile.index + i + 5),
                  ])}
                  segments
                  lineWidth={4}
                  polygonOffset={true}
                  polygonOffsetFactor={-100}
                  polygonOffsetUnits={-100}
                />
              )}
            </group>
          );
        })}
      {showChunks &&
        chunks.flatMap((chunk) => {
          const points = new Array<Vector3>();
          const triCenters = new Array<Vector3>();
          const chunkCenter = new Vector3();
          for (const tri of chunk.triangles) {
            if (!tri) continue;
            const p0 = projectCoords(tri.a.coords);
            const p1 = projectCoords(tri.b.coords);
            const p2 = projectCoords(tri.c.coords);
            if (Math.abs(p1.x - p0.x) > 0.8 || Math.abs(p2.x - p0.x) > 0.8)
              continue; // TODO: figure out wrapping
            points.push(
              ...[p0, p1, p2].map((p) =>
                lerpToward(p, getCenter([p0, p1, p2])),
              ),
            );
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
            points.flatMap(() => getColorForIndex(chunk.index) /*rgb.flat()*/),
          );

          //if (chunk.face.index === 0) console.log(chunk.index, chunk.tris);

          return positions.length === 0 ? null : (
            <Fragment key={chunk.index}>
              {false && <Line points={triCenters} lineWidth={4} />}
              {false &&
                chunk.triangles.map((tri) => {
                  if (!tri) return null;
                  const p0 = projectCoords(tri.a.coords);
                  const p1 = projectCoords(tri.b.coords);
                  const p2 = projectCoords(tri.c.coords);
                  if (
                    Math.abs(p1.x - p0.x) > 0.8 ||
                    Math.abs(p2.x - p0.x) > 0.8
                  )
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
              <mesh>
                <bufferGeometry>
                  <ArrayAttribute
                    attribute="position"
                    array={positions}
                    itemSize={3}
                  />
                  <ArrayAttribute
                    attribute="color"
                    array={colors}
                    itemSize={3}
                  />
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
                  <ArrayAttribute
                    attribute="position"
                    array={positions}
                    itemSize={3}
                  />
                </bufferGeometry>
                <meshBasicMaterial wireframe={true} color={"black"} />
              </mesh>
            </Fragment>
          );
        })}
      <IcoMeshes />
    </Fragment>
  );
};
