import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { folder, useControls } from "leva";
import React, { type FC, Fragment, useContext, useMemo } from "react";
import { BufferAttribute, BufferGeometry, Vector3 } from "three";
import { AppContext } from "../App";
import { Icosphere } from "../board/Icosphere";
import { getShapeName, validateBoard } from "../board/boardHelpers";
import { lerpToward } from "../utils/mathUtils";
import { getColorForIndex } from "../utils/renderingUtils";
import { ArrayAttribute } from "./ArrayAttribute";
import { IcoMeshes } from "./IcoMeshes";
import { Label } from "./Label";
import { ChunkMesh } from "./chunk/ChunkMesh";

import frag from "./chunk/chunk.frag";
import vert from "./chunk/chunk.vert";

const vert3D = `${vert}`.replace("#define IS_3D 0", "#define IS_3D 1");

export const Scene: FC<{ icosphereSize: number }> = ({ icosphereSize }) => {
  //----------------------------------------------------------------------------

  const { is3D, projectCoords, projectCoordsArray } = useContext(AppContext);
  const { doSwap, show, showTileIndices } = useControls({
    tiles: folder({
      doSwap: true,
      show: false,
      showTileIndices: false,
      showChunks: false,
    }),
  });

  const { tiles, chunks, triangles, tilePositionAttribute } = useMemo(() => {
    const board = new Icosphere(icosphereSize, doSwap);
    validateBoard(board);

    const buffer = new Float32Array(board.tiles.length * 3.0);
    for (const tile of board.tiles) {
      buffer[tile.index * 3] = tile.xyz.x;
      buffer[tile.index * 3 + 1] = tile.xyz.y;
      buffer[tile.index * 3 + 2] = tile.xyz.z;
    }
    const tilePositionAttribute = new BufferAttribute(buffer, 3, false);
    return { ...board, tilePositionAttribute };
  }, [icosphereSize, doSwap]);
  console.log(tiles.length);

  //----------------------------------------------------------------------------

  const indices = useMemo(() => {
    const result = new Uint32Array(triangles.length * 3);
    let i = 0;
    for (const tri of triangles) {
      result[i++] = tri.a.index;
      result[i++] = tri.b.index;
      result[i++] = tri.c.index;
    }
    return result;
  }, [triangles]);

  const uniforms = React.useMemo(
    () => ({
      v_time: { value: 0.0 },
    }),
    [],
  );

  const ref = React.useRef(new BufferGeometry());
  React.useEffect(() => {
    ref.current.setAttribute("position", tilePositionAttribute);
  }, [tilePositionAttribute]);

  useFrame((_, delta) => {
    uniforms.v_time.value += delta;
  });

  return (
    <mesh rotation={is3D ? undefined : [-Math.PI / 2.0, 0, 0]}>
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

/*
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
      {chunks.map((chunk) => (
        <ChunkMesh
          key={chunk.index}
          chunk={chunk}
          tilePositionAttribute={tilePositionAttribute}
        />
      ))}
      <IcoMeshes />
 */
