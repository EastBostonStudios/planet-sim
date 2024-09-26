import { Vector2 } from "three";
import { type IcosphereFace, icosahedron } from "./Icosahedron";

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

const createRow = (
  result: Array<Tile>,
  resolution: number,
  face: IcosphereFace,
  useB: boolean,
) => {
  for (let i = 1; i < (resolution + 1) * 5; i++) {
    const t = i / ((resolution + 1) * 5);
    result.push(
      createTile(
        result.length,
        face,
        useB ? new Vector2(1.0 - t, 1.0 - t) : new Vector2(t, 0.0),
      ),
    );
  }
};

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

  // Diagonal
  createRow(result, resolution, icosahedron.faces[0], false);
  createRow(result, resolution, icosahedron.faces[1], false);
  createRow(result, resolution, icosahedron.faces[2], false);
  createRow(result, resolution, icosahedron.faces[3], false);
  createRow(result, resolution, icosahedron.faces[4], false);

  // Horizontal
  createRow(result, resolution, icosahedron.faces[5], true);
  createRow(result, resolution, icosahedron.faces[7], true);
  createRow(result, resolution, icosahedron.faces[9], true);
  createRow(result, resolution, icosahedron.faces[11], true);
  createRow(result, resolution, icosahedron.faces[13], true);

  // Diagonal
  createRow(result, resolution, icosahedron.faces[5], false);
  createRow(result, resolution, icosahedron.faces[6], true);
  createRow(result, resolution, icosahedron.faces[7], false);
  createRow(result, resolution, icosahedron.faces[8], true);
  createRow(result, resolution, icosahedron.faces[9], false);
  createRow(result, resolution, icosahedron.faces[10], true);
  createRow(result, resolution, icosahedron.faces[11], false);
  createRow(result, resolution, icosahedron.faces[12], true);
  createRow(result, resolution, icosahedron.faces[13], false);
  createRow(result, resolution, icosahedron.faces[14], true);

  // Horizontal
  createRow(result, resolution, icosahedron.faces[6], false);
  createRow(result, resolution, icosahedron.faces[8], false);
  createRow(result, resolution, icosahedron.faces[10], false);
  createRow(result, resolution, icosahedron.faces[12], false);
  createRow(result, resolution, icosahedron.faces[14], false);

  // Diagonal
  createRow(result, resolution, icosahedron.faces[15], true);
  createRow(result, resolution, icosahedron.faces[16], true);
  createRow(result, resolution, icosahedron.faces[17], true);
  createRow(result, resolution, icosahedron.faces[18], true);
  createRow(result, resolution, icosahedron.faces[19], true);

  console.assert(
    result.every((tile, i) => tile.index === i),
    "Tile indices incorrect!",
  );

  return result;
};
