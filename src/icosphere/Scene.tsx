import { Html, Line } from "@react-three/drei";
import type { GroupProps } from "@react-three/fiber";
import {
  type FC,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { type Vector2, Vector3 } from "three";
import { AppContext } from "../App";
import {
  type IcosphereEdge,
  type IcosphereFace,
  type IcospherePoint,
  distBetweenPoints,
  icosahedron,
} from "./Icosahedron";
import { type Tile, getTiles } from "./Tile";

import styled from "styled-components";
import { getChunks } from "./Chunk";
import { interpolateOnFace } from "./utils";

const Asdf = styled(Html)<{ $color: string }>`
  color: ${({ $color }) => $color};
  pointer-events: none;
  font-size: 12px;
  text-shadow: 1px 1px black;
`;

const StyledLabel: FC<
  { color?: string; children: ReactNode } & Partial<GroupProps>
> = ({ color, children, ...otherProps }) => {
  const { is3D } = useContext(AppContext);
  return (
    <group {...otherProps}>
      <Asdf
        center
        $color={color ?? "lightgrey"}
        occlude={"raycast"}
        position={is3D ? undefined : [0, 0, 0.1]}
      >
        <strong>{children}</strong>
      </Asdf>
    </group>
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
      count={3}
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

//----------------------------------------------------------------------------------------------------------------------

export const Scene: FC<{ resolution: number }> = ({ resolution }) => {
  //--------------------------------------------------------------------------------------------------------------------

  const tiles = useMemo(() => new Array<Tile>() /*getTiles(resolution)*/, []);
  const chunks = useMemo(() => getChunks(resolution), [resolution]);
  const { is3D } = useContext(AppContext);

  useEffect(() => {
    tiles.forEach((tile, index) => {
      if (tile.index !== index)
        throw new Error(`Tile ${index} has an index of ${tile.index}`);
    });
  }, [tiles]);

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
    (point: Tile): Vector3 => {
      if (is3D) return project3D(point.coords3D);
      return project2D(point.coords2D);
    },
    [is3D],
  );

  //--------------------------------------------------------------------------------------------------------------------

  return (
    <Fragment key={resolution}>
      {tiles.map((tile) => (
        <StyledLabel
          key={tile.index}
          color={"white"}
          position={getTileXYZ(tile)}
        >
          t{tile.index}
        </StyledLabel>
      ))}
      {chunks.map(({ index, face, faceCoords }) => {
        const [a, b, c] = getFaceXYZs(face);
        const point0 = interpolateOnFace({ a, b, c, p: faceCoords.a });
        const point1 = interpolateOnFace({ a, b, c, p: faceCoords.b });
        const point2 = interpolateOnFace({ a, b, c, p: faceCoords.c });
        //if (face.index === 5) console.log(index, faceCoords)
        const positions = new Float32Array(
          [point0, point1, point2].flatMap((point) => [
            point.x,
            point.y,
            point.z,
          ]),
        );
        const colors = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        return (
          <Fragment key={index}>
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
      {icosahedron.points.map((point) => (
        <StyledLabel key={point.index} position={getPointXYZ(point)}>
          p{point.index}
        </StyledLabel>
      ))}
      {icosahedron.edges.map((edge) => {
        const [start, end] = getEdgeXYZs(edge);
        return (
          <Fragment key={edge.index}>
            <StyledLabel position={new Vector3().lerpVectors(start, end, 0.5)}>
              e{edge.index}
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
      {icosahedron.faces.map((face) => {
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
          </group>
        );
      })}
    </Fragment>
  );
};
