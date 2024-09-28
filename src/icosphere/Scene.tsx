import { Line } from "@react-three/drei";
import type { GroupProps } from "@react-three/fiber";
import React, {
  type FC,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import styled from "styled-components";
import { type Vector2, Vector3 } from "three";
import { AppContext } from "../App";
import { GameBoard, type GameBoardTile } from "../board/GameBoard";
import { HtmlOverlay3D } from "../utils/HtmlOverlay";
import {
  type IcosphereEdge,
  type IcosphereFace,
  type IcospherePoint,
  distBetweenPoints,
  icosahedron,
} from "./Icosahedron";
import { interpolateOnFace } from "./utils";

const StyledHtml = styled.strong<{ $color: string }>`
  color: ${({ $color }) => $color};
  pointer-events: none;
  font-size: 12px;
  text-shadow: 1px 1px black;
`;

const getColorForIndex = (index: number): [number, number, number] => [
  ((index % 3) + 2) / 10,
  ((index % 7) + 2) / 11,
  ((index % 11) + 2) / 15,
];

const StyledLabel: FC<
  {
    color?: string;
    position: Vector3;
    children: ReactNode;
  } & Partial<GroupProps>
> = ({ color, position, children }) => {
  const { is3D } = useContext(AppContext);
  return (
    <HtmlOverlay3D
      key={is3D ? "3D" : "2D"}
      x={position.x}
      y={position.y}
      z={position.z}
      noOcclusion
    >
      <StyledHtml $color={color ?? "white"}>{children}</StyledHtml>
    </HtmlOverlay3D>
  );
};

const TripleAttribute: FC<{ attribute: string; array: Float32Array }> = ({
  attribute,
  array,
}) => {
  return (
    <bufferAttribute
      attach={`attributes-${attribute}`}
      array={array}
      count={array.length / 3}
      itemSize={3}
    />
  );
};

const rgb: [number, number, number][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const greyAndBlack: [number, number, number][] = [
  [0.5, 0.5, 0.5],
  [0, 0, 0],
];

const theta = Math.PI + 1.0172219678840608; // atan(phi, 1) Rotates 0 down to y = -1

const project3D = ({ x, y, z }: Vector3) => {
  // return new Vector3(x, y, z)
  return new Vector3(
    x * Math.cos(theta) - y * Math.sin(theta),
    x * Math.sin(theta) + y * Math.cos(theta),
    z,
  );
};

const project2D = (xy: Vector2) =>
  new Vector3(
    xy.x * distBetweenPoints - xy.y * distBetweenPoints * 0.5,
    (xy.y * distBetweenPoints * Math.sqrt(3.0)) / 2.0,
    0,
  );

export const Scene: FC<{ resolution: number }> = ({ resolution }) => {
  //----------------------------------------------------------------------------

  const { is3D } = useContext(AppContext);

  const { tiles, chunks } = useMemo(
    () => new GameBoard(resolution),
    [resolution],
  );

  const getFaceXYZs = useCallback(
    (face: IcosphereFace): [Vector3, Vector3, Vector3] => {
      if (is3D) {
        const a = face.a.coords3D;
        const b = face.b.coords3D;
        const c = face.c.coords3D;
        return [project3D(a), project3D(b), project3D(c)];
      }
      let a = face.a.coords2D;
      let b = face.b.coords2D;
      let c = face.c.coords2D;
      if (face.wrapsMeridian) {
        if (a.x === 0) a = a.clone().setX(5.0);
        if (b.x === 0) b = b.clone().setX(5.0);
        if (c.x === 0) c = c.clone().setX(5.0);
      }
      return [project2D(a), project2D(b), project2D(c)];
    },
    [is3D],
  );

  const getEdgeXYZs = useCallback(
    (edge: IcosphereEdge): [Vector3, Vector3] => {
      if (is3D)
        return [project3D(edge.start.coords3D), project3D(edge.end.coords3D)];
      let start = edge.start.coords2D;
      let end = edge.end.coords2D;
      if (edge.wrapsMeridian) {
        if (start.x === 0) start = start.clone().setX(5.0);
        if (end.x === 0) end = end.clone().setX(5.0);
      }
      return [project2D(start), project2D(end)];
    },
    [is3D],
  );

  const getPointXYZ = useCallback(
    (point: IcospherePoint): Vector3 => {
      if (is3D) return project3D(point.coords3D);
      return project2D(point.coords2D);
    },
    [is3D],
  );

  const getTileXYZ = useCallback(
    (tile: GameBoardTile): Vector3 => {
      const [a, b, c] = getFaceXYZs(tile.face);
      return interpolateOnFace({ a, b, c, p: tile.faceCoords });
    },
    [getFaceXYZs],
  );

  //----------------------------------------------------------------------------

  return (
    <Fragment key={resolution}>
      {tiles.map((tile) => {
        const tilePosition = getTileXYZ(tile);
        const points = new Array<Vector3>();

        for (const neighbor of tile.neighbors) {
          if (!neighbor) continue;
          const neighborPosition = getTileXYZ(neighbor);
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
            {tile.index < 10 && (
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
      {chunks.flatMap((chunk) => {
        const points = new Array<Vector3>();
        const triCenters = new Array<Vector3>();
        const chunkCenter = new Vector3();
        for (const tri of chunk.tris) {
          if (!tri) continue;
          const p0 = getTileXYZ(tri.a);
          const p1 = getTileXYZ(tri.b);
          const p2 = getTileXYZ(tri.c);
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
                const p0 = getTileXYZ(tri.a);
                const p1 = getTileXYZ(tri.b);
                const p2 = getTileXYZ(tri.c);
                if (Math.abs(p1.x - p0.x) > 0.8 || Math.abs(p2.x - p0.x) > 0.8)
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
                <TripleAttribute attribute="position" array={positions} />
                <TripleAttribute attribute="color" array={colors} />
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
                <TripleAttribute attribute="position" array={positions} />
              </bufferGeometry>
              <meshBasicMaterial wireframe={true} color={"black"} />
            </mesh>
          </Fragment>
        );
      })}
      {false &&
        icosahedron.points.map((point) => (
          <StyledLabel key={point.index} position={getPointXYZ(point)}>
            p{point.index}
          </StyledLabel>
        ))}
      {false &&
        icosahedron.edges.map((edge) => {
          const [start, end] = getEdgeXYZs(edge);
          return (
            <Fragment key={edge.index}>
              <StyledLabel
                position={new Vector3().lerpVectors(start, end, 0.5)}
              >
                <h2>e{edge.index}</h2>
              </StyledLabel>
              <Line
                points={[start, end]}
                vertexColors={greyAndBlack}
                lineWidth={4}
                segments
              />
            </Fragment>
          );
        })}
      {false &&
        icosahedron.faces.map((face) => {
          const facePoints = getFaceXYZs(face);
          const faceCenter = new Vector3()
            .add(facePoints[0])
            .add(facePoints[1])
            .add(facePoints[2])
            .divideScalar(3.0);
          return (
            <group key={face.index}>
              <StyledLabel position={faceCenter}>f{face.index}</StyledLabel>
              {facePoints.map((point, i) => (
                <StyledLabel
                  key={`${point.x},${point.y}${point.z}`}
                  position={point.clone().lerp(faceCenter, 0.2)}
                >
                  {i === 0 ? "a" : i === 1 ? "b" : "c"}
                </StyledLabel>
              ))}
              {false && (
                <Line
                  points={[...facePoints, facePoints[0]].map((point) =>
                    point.clone().lerp(faceCenter, 0.2),
                  )}
                  vertexColors={[...rgb, rgb[0]]}
                  lineWidth={4}
                  dashed={face.wrapsMeridian}
                  dashSize={0.01}
                  gapSize={0.01}
                />
              )}
            </group>
          );
        })}
    </Fragment>
  );
};
