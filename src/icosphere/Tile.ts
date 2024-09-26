import { Vector2 } from "three";
import { type IcosphereFace, icosahedron } from "./Icosahedron";

export type Tile = {
  index: number;
  face: IcosphereFace;
  faceCoords: Vector2;
};

export const getTiles = (resolution: number): ReadonlyArray<Tile> => {
  const result = new Array<Tile>();

  result.push(
    {
      index: 0,
      face: icosahedron.faces[0],
      faceCoords: new Vector2(0.0, 0.0),
    },
    {
      index: 1,
      face: icosahedron.faces[0],
      faceCoords: new Vector2(1.0, 0.0),
    },
    {
      index: 2,
      face: icosahedron.faces[1],
      faceCoords: new Vector2(1.0, 0.0),
    },
    {
      index: 3,
      face: icosahedron.faces[2],
      faceCoords: new Vector2(1.0, 0.0),
    },
    {
      index: 4,
      face: icosahedron.faces[3],
      faceCoords: new Vector2(1.0, 0.0),
    },
    {
      index: 5,
      face: icosahedron.faces[4],
      faceCoords: new Vector2(1.0, 0.0),
    },
    {
      index: 6,
      face: icosahedron.faces[6],
      faceCoords: new Vector2(0.0, 0.0),
    },
    {
      index: 7,
      face: icosahedron.faces[8],
      faceCoords: new Vector2(0.0, 0.0),
    },
    {
      index: 8,
      face: icosahedron.faces[10],
      faceCoords: new Vector2(0.0, 0.0),
    },
    {
      index: 9,
      face: icosahedron.faces[12],
      faceCoords: new Vector2(0.0, 0.0),
    },
    {
      index: 10,
      face: icosahedron.faces[14],
      faceCoords: new Vector2(0.0, 0.0),
    },
    {
      index: 11,
      face: icosahedron.faces[19],
      faceCoords: new Vector2(0.0, 0.0),
    },
  );
  return result;
};
