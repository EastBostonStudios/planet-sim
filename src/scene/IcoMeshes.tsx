import { Line } from "@react-three/drei";
import React, { Fragment, useContext, type FC } from "react";
import { AppContext } from "../App";
import * as Icosahedron from "../board/Icosahedron";
import { closeLoop, getCenter, lerpToward } from "../utils/mathUtils";
import { StyledLabel } from "./StyledLabel";

//------------------------------------------------------------------------------

export const IcoMeshes: FC<{
  showPoints: boolean;
  showEdges: boolean;
  showFaces: boolean;
}> = ({ showPoints, showEdges, showFaces }) => {
  //----------------------------------------------------------------------------

  const { pointProjector, projectCoords } = useContext(AppContext);
  return (
    <>
      {showPoints &&
        Icosahedron.points.map((point) => (
          <StyledLabel key={point.index} position={pointProjector(point)}>
            p{point.index}
          </StyledLabel>
        ))}
      {showEdges &&
        Icosahedron.edges.map((edge) => {
          const edgePoints = [
            pointProjector(edge.start),
            pointProjector(edge.end),
          ];
          const edgeCenter = getCenter(edgePoints);
          return (
            <Fragment key={edge.index}>
              <StyledLabel position={edgeCenter}>
                <h2>e{edge.index}</h2>
              </StyledLabel>
              <Line
                points={edgePoints}
                vertexColors={[
                  [0.5, 0.5, 0.5],
                  [0.0, 0.0, 0.0],
                ]}
                lineWidth={4}
                segments
              />
            </Fragment>
          );
        })}
      {showFaces &&
        Icosahedron.faces.map((face) => {
          const points = [
            projectCoords({ face, x: 0, y: 0 }),
            projectCoords({ face, x: 1, y: 0 }),
            projectCoords({ face, x: 1, y: 1 }),
          ];
          const center = getCenter(points);
          return (
            <Fragment key={face.index}>
              <StyledLabel position={center}>
                <h2>f{face.index}</h2>
              </StyledLabel>
              {points.map((point, i) => {
                const key = i === 0 ? "a" : i === 1 ? "b" : "c";
                return (
                  <StyledLabel key={key} position={lerpToward(point, center)}>
                    <h3>{key}</h3>
                  </StyledLabel>
                );
              })}
              <Line
                points={closeLoop(points).map((p) => lerpToward(p, center))}
                vertexColors={[
                  [1, 0, 0],
                  [0, 1, 0],
                  [0, 0, 1],
                  [1, 0, 0],
                ]}
                lineWidth={4}
                dashed={face.wrapsMeridian}
                dashSize={0.01}
                gapSize={0.01}
              />
            </Fragment>
          );
        })}
    </>
  );
};
