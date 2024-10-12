import { Line } from "@react-three/drei";
import { folder, useControls } from "leva";
import React, { type FC, Fragment, useContext, useMemo } from "react";
import { Vector3 } from "three";
import { AppContext } from "../App";
import { Icosphere } from "../board/Icosphere";
import { getShapeName, validateBoard } from "../board/boardHelpers";
import { lerpToward } from "../utils/mathUtils";
import { getColorForIndex } from "../utils/renderingUtils";
import { ArrayAttribute } from "./ArrayAttribute";
import { IcoMeshes } from "./IcoMeshes";
import { Label } from "./Label";
import { ChunkMesh } from "./chunk/ChunkMesh";

export const Scene: FC<{ icosphereSize: number }> = ({ icosphereSize }) => {
  //----------------------------------------------------------------------------

  const { projectCoords, projectCoordsArray } = useContext(AppContext);
  const { doSwap, show, showTileIndices } = useControls({
    tiles: folder({
      doSwap: true,
      show: false,
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
      {show &&
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
      {chunks
        .filter((chunk) => ![4, 13, 14, 19].includes(chunk.face.index))
        .map((chunk) => (
          <ChunkMesh key={chunk.index} chunk={chunk} />
        ))}
      <IcoMeshes />
    </Fragment>
  );
};
