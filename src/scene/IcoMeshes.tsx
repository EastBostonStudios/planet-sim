import { Line } from "@react-three/drei";
import React, { Fragment, useCallback, useContext, type FC } from "react";
import { type Vector2, Vector3 } from "three";
import { AppContext } from "../App";
import * as Icosahedron from "../board/Icosahedron";
import { StyledLabel } from "./StyledLabel";

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
    xy.x * Icosahedron.distBetweenPoints -
      xy.y * Icosahedron.distBetweenPoints * 0.5,
    (xy.y * Icosahedron.distBetweenPoints * Math.sqrt(3.0)) / 2.0,
    0,
  );

const rgb: [number, number, number][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const greyAndBlack: [number, number, number][] = [
  [0.5, 0.5, 0.5],
  [0, 0, 0],
];

export const IcoMeshes: FC<{
  showPoints: boolean;
  showEdges: boolean;
  showFaces: boolean;
}> = ({ showPoints, showEdges, showFaces }) => {
  const { is3D } = useContext(AppContext);
  const getFaceXYZs = useCallback(
    (face: Icosahedron.Face): [Vector3, Vector3, Vector3] => {
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
    (edge: Icosahedron.Edge): [Vector3, Vector3] => {
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
    (point: Icosahedron.Point): Vector3 => {
      if (is3D) return project3D(point.coords3D);
      return project2D(point.coords2D);
    },
    [is3D],
  );

  return (
    <>
      {showPoints &&
        Icosahedron.points.map((point) => (
          <StyledLabel key={point.index} position={getPointXYZ(point)}>
            p{point.index}
          </StyledLabel>
        ))}
      {showEdges &&
        Icosahedron.edges.map((edge) => {
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
      {showFaces &&
        Icosahedron.faces.map((face) => {
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
    </>
  );
};
