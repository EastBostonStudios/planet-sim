import {
  Grid,
  MapControls,
  OrbitControls,
  PerspectiveCamera,
  Stats,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { createContext } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { DoubleSide, Vector3 } from "three";
import * as Icosahedron from "./board/Icosahedron";
import { distBetweenPoints } from "./board/Icosahedron";
import type { IcoCoords } from "./board/Icosphere";
import { Scene } from "./scene/Scene";
import { foo } from "./shaderTest/webComputeTest";
import { HtmlOverlaysProvider } from "./utils/HtmlOverlaysProvider";
import { interpolateOnFace } from "./utils/mathUtils";

const StyledApp = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: darkslategray;
`;

const StyledTopBar = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  z-index: 999;
`;

const StyledToolbar = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  color: white;
`;

const StyledButtonHolder = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

const minResolution = 0;
const maxResolution = 8;
const defaultResolution = 1;

const dbp = Icosahedron.distBetweenPoints;

//------------------------------------------------------------------------------

export const AppContext = createContext<{
  is3D: boolean;
  pointProjector: (point: Icosahedron.Point) => Vector3;
  projectCoords: (coords: IcoCoords) => Vector3;
  projectCoordsArray: (coords: IcoCoords[]) => Vector3[];
}>({
  is3D: false,
  pointProjector: () => new Vector3(),
  projectCoords: () => {
    throw new Error("Method not implemented");
  },
  projectCoordsArray: () => {
    throw new Error("Method not implemented");
  },
});

const App = () => {
  //----------------------------------------------------------------------------

  const [searchParams, setSearchParams] = useSearchParams();

  const icosphereSize = React.useMemo(() => {
    const param = searchParams.get("size");
    if (Number.isNaN(param)) return defaultResolution;
    return Math.min(maxResolution, Math.max(minResolution, Number(param)));
  }, [searchParams]);

  const is3D = React.useMemo(
    () => searchParams.get("is3D") === "true",
    [searchParams],
  );

  const { pointProjector, projectCoords, projectCoordsArray } =
    React.useMemo(() => {
      const projector3D: (point: Icosahedron.Point) => Vector3 = (point) =>
        point.coords3D;

      const projector2D: (
        point: Icosahedron.Point,
        offset?: number,
      ) => Vector3 = (point, offset) =>
        new Vector3(
          point.coords2D.x * dbp -
            point.coords2D.y * dbp * 0.5 +
            (offset ?? 0) * distBetweenPoints,
          (point.coords2D.y * dbp * Math.sqrt(3.0)) / 2.0,
          0,
        );

      const projectCoords: (coords: IcoCoords) => Vector3 = is3D
        ? (coords) => {
            const a = projector3D(coords.face.a);
            const b = projector3D(coords.face.b);
            const c = projector3D(coords.face.c);
            return interpolateOnFace(a, b, c, coords.x, coords.y);
          }
        : (coords) => {
            const a = projector2D(coords.face.a);
            const b = projector2D(coords.face.b);
            const c = projector2D(coords.face.c);

            const faceIndex = coords.face.index;
            if (faceIndex === 14 || faceIndex === 19)
              b.add(new Vector3(5 * distBetweenPoints, 0, 0));
            if (faceIndex === 4 || faceIndex === 13 || faceIndex === 14)
              c.add(new Vector3(5 * distBetweenPoints, 0, 0));

            return interpolateOnFace(a, b, c, coords.x, coords.y);
          };

      const projectCoordsArray: (coords: IcoCoords[]) => Vector3[] = is3D
        ? (coordsArray) =>
            coordsArray.map((coords) => {
              const a = projector3D(coords.face.a);
              const b = projector3D(coords.face.b);
              const c = projector3D(coords.face.c);
              return interpolateOnFace(a, b, c, coords.x, coords.y);
            })
        : (coordsArray) => {
            const doesWrap =
              coordsArray.some((coords) => {
                const fi = coords.face.index;
                return fi === 4 || fi === 13 || fi === 14 || fi === 19;
              }) &&
              coordsArray.some((coords) => {
                const fi = coords.face.index;
                return fi === 0 || fi === 5 || fi === 6 || fi === 15;
              });
            return coordsArray.map((coords) => {
              const a = projector2D(coords.face.a);
              const b = projector2D(coords.face.b);
              const c = projector2D(coords.face.c);

              const faceIndex = coords.face.index;
              if (!doesWrap) {
                if (faceIndex === 14 || faceIndex === 19)
                  b.add(new Vector3(5 * distBetweenPoints, 0, 0));
                if (faceIndex === 4 || faceIndex === 13 || faceIndex === 14)
                  c.add(new Vector3(5 * distBetweenPoints, 0, 0));
              } else {
                if (faceIndex === 4) {
                  b.add(new Vector3(-5 * distBetweenPoints, 0, 0));
                }
                if (faceIndex === 13) {
                  a.add(new Vector3(-5 * distBetweenPoints, 0, 0));
                  b.add(new Vector3(-5 * distBetweenPoints, 0, 0));
                }
                if (faceIndex === 14) {
                  a.add(new Vector3(-5 * distBetweenPoints, 0, 0));
                }
                if (faceIndex === 19) {
                  c.add(new Vector3(-5 * distBetweenPoints, 0, 0));
                }
              }
              return interpolateOnFace(a, b, c, coords.x, coords.y);
            });
          };

      return {
        pointProjector: is3D ? projector3D : projector2D,
        projectCoords,
        projectCoordsArray,
      };
    }, [is3D]);

  //----------------------------------------------------------------------------

  React.useEffect(() => {
    foo();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  //----------------------------------------------------------------------------

  return (
    <AppContext.Provider
      value={{ is3D, pointProjector, projectCoords, projectCoordsArray }}
    >
      <StyledApp className="App">
        <StyledTopBar>
          <StyledToolbar>
            <h4>Icosphere size: {icosphereSize}</h4>
            <input
              type="range"
              min={minResolution}
              max={maxResolution}
              value={icosphereSize}
              onChange={(e) =>
                setSearchParams((prev) => {
                  prev.set("size", e.target.value);
                  return prev;
                })
              }
            />
            <StyledButtonHolder>
              <button
                type="button"
                onClick={() =>
                  setSearchParams((prev) => {
                    const prevValue = prev.get("is3D") === "true";
                    prev.set("is3D", prevValue ? "false" : "true");
                    return prev;
                  })
                }
              >
                {is3D ? "3D" : "2D"}
              </button>
            </StyledButtonHolder>
          </StyledToolbar>
        </StyledTopBar>
        <HtmlOverlaysProvider>
          <Canvas>
            <Stats />
            <directionalLight rotation={[45, 45, 45]} />
            {is3D ? (
              <group key="3D">
                {true && <axesHelper args={[5]} />}
                <OrbitControls />
                <PerspectiveCamera makeDefault position={[-3, 0, 1]} />
                <Scene icosphereSize={icosphereSize} />
              </group>
            ) : (
              <group key="2D">
                <MapControls />
                <PerspectiveCamera
                  makeDefault
                  position={[0, 6, 0]}
                  rotation={[Math.PI / 2.0, 0, 0]}
                />
                <group position={[0, 0, 0]} rotation={[-Math.PI / 2.0, 0, 0]}>
                  <Scene icosphereSize={icosphereSize} />
                </group>
                <Grid
                  position={[0, 0.01, 0]}
                  side={DoubleSide}
                  cellSize={0.1}
                  cellColor="grey"
                  sectionColor="grey"
                  infiniteGrid
                  followCamera
                />
              </group>
            )}
          </Canvas>
        </HtmlOverlaysProvider>
      </StyledApp>
    </AppContext.Provider>
  );
};

export default App;
