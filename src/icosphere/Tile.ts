import { Vector2 } from "three";
import {
  IcosphereEdge,
  type IcosphereFace,
  IcospherePoint,
  icosahedron,
} from "./Icosahedron";

export type Tile = {
  index: number;
  face: IcosphereFace;
  faceCoords: Vector2;
};

const createTile = (
  index: number,
  face: IcosphereFace,
  faceCoords: Vector2,
): Tile => ({ index, face, faceCoords });

export const getTiles = (resolution: number): ReadonlyArray<Tile> => {
  const result = new Array<Tile>();

  result.push(
    createTile(0, icosahedron.faces[0], new Vector2(0.0, 0.0)),
    createTile(1, icosahedron.faces[0], new Vector2(1.0, 0.0)),
    createTile(2, icosahedron.faces[1], new Vector2(1.0, 0.0)),
    createTile(3, icosahedron.faces[2], new Vector2(1.0, 0.0)),
    createTile(4, icosahedron.faces[3], new Vector2(1.0, 0.0)),
    createTile(5, icosahedron.faces[4], new Vector2(1.0, 0.0)),
    createTile(6, icosahedron.faces[6], new Vector2(0.0, 0.0)),
    createTile(7, icosahedron.faces[8], new Vector2(0.0, 0.0)),
    createTile(8, icosahedron.faces[10], new Vector2(0.0, 0.0)),
    createTile(9, icosahedron.faces[12], new Vector2(0.0, 0.0)),
    createTile(10, icosahedron.faces[14], new Vector2(0.0, 0.0)),
    createTile(11, icosahedron.faces[19], new Vector2(0.0, 0.0)),
  );
  return result;
};
