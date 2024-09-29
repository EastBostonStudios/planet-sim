import { Line } from "@react-three/drei";
import React, { type FC, Fragment, useContext, useMemo } from "react";
import { Vector3 } from "three";
import { AppContext } from "../App";
import { GameBoard } from "../board/GameBoard";
import { IcoMeshes } from "./IcoMeshes";
import { StyledLabel } from "./StyledLabel";

const getColorForIndex = (index: number): [number, number, number] => [
  ((index % 3) + 2) / 10,
  ((index % 7) + 2) / 11,
  ((index % 11) + 2) / 15,
];

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

export const Scene: FC<{ resolution: number }> = ({ resolution }) => {
  //----------------------------------------------------------------------------

  const { projectCoords } = useContext(AppContext);

  const { tiles, chunks } = useMemo(
    () => new GameBoard(resolution),
    [resolution],
  );

  //----------------------------------------------------------------------------

  return (
    <Fragment key={resolution}>
      {tiles.map((tile) => {
        const tilePosition = projectCoords(tile.coords);
        const points = new Array<Vector3>();

        for (const neighbor of tile.neighbors) {
          if (!neighbor) continue;
          const neighborPosition = projectCoords(neighbor.coords);
          if (neighborPosition.distanceTo(tilePosition) > 0.333) continue;

          points.push(
            new Vector3().lerpVectors(tilePosition, neighborPosition, 0.45),
          );
        }
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

        return (
          <group key={tile.index}>
            {false && (
              <StyledLabel position={tilePosition}>t{tile.index}</StyledLabel>
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
                  p,
                  points[(i + 1) % points.length],
                ])}
                vertexColors={points.flatMap((_, i) => [
                  getColorForIndex(tile.index + i + 5),
                  getColorForIndex(tile.index + i + 5),
                ])}
                segments
                lineWidth={8}
                polygonOffset={true}
                polygonOffsetFactor={-100}
                polygonOffsetUnits={-100}
              />
            )}
          </group>
        );
      })}
      {false &&
        chunks.flatMap((chunk) => {
          const points = new Array<Vector3>();
          const triCenters = new Array<Vector3>();
          const chunkCenter = new Vector3();
          for (const tri of chunk.tris) {
            if (!tri) continue;
            const p0 = projectCoords(tri.a.coords);
            const p1 = projectCoords(tri.b.coords);
            const p2 = projectCoords(tri.c.coords);
            if (Math.abs(p1.x - p0.x) > 0.8 || Math.abs(p2.x - p0.x) > 0.8)
              continue; // TODO: figure out wrapping
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
            points.flatMap(() => getColorForIndex(chunk.index) /*rgb.flat()*/),
          );

          //if (chunk.face.index === 0) console.log(chunk.index, chunk.tris);

          return positions.length === 0 ? null : (
            <Fragment key={chunk.index}>
              {false && <Line points={triCenters} lineWidth={4} />}
              {false &&
                chunk.tris.map((tri) => {
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
                    <StyledLabel key={tri.index} position={center}>
                      t{tri.index}
                    </StyledLabel>
                  );
                })}
              {false && (
                <StyledLabel position={chunkCenter}>c{chunk.index}</StyledLabel>
              )}
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
      <IcoMeshes showPoints={true} showEdges={true} showFaces={true} />
    </Fragment>
  );
};
