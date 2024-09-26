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

const createEdgeTiles = (
  result: Array<Tile>,
  resolution: number,
  face: IcosphereFace,
  useB: boolean,
) => {
  for (let i = 1; i < (resolution + 1) * 5; i++) {
    const s = i / ((resolution + 1) * 5);
    result.push(
      createTile(
        result.length,
        face,
        useB ? new Vector2(1.0 - s, 1.0 - s) : new Vector2(s, 0.0),
      ),
    );
  }
};

const createTrussTiles = (
  result: Array<Tile>,
  resolution: number,
  face: IcosphereFace,
) => {
  // a -> b (horizontal) rows
  for (let chunkJ = 1; chunkJ <= resolution; chunkJ++) {
    const t = chunkJ / (resolution + 1.0);
    for (let i = chunkJ * 5.0 + 1; i < (resolution + 1) * 5.0; i++) {
      const s = i / ((resolution + 1) * 5.0);
      result.push(createTile(result.length, face, new Vector2(s, t)));
    }
  }

  // b -> c (diagonal) rows
  for (let chunkI = 1; chunkI <= resolution; chunkI++) {
    const s = chunkI / (resolution + 1.0);
    for (let j = 1; j < chunkI * 5.0; j++) {
      if (j % 5 === 0) continue; // Ignore intersection with horizontal rows
      const t = j / ((resolution + 1.0) * 5.0);
      result.push(createTile(result.length, face, new Vector2(s, t)));
    }
  }

  // c -> a (diagonal) rows
  for (let chunkI = 1; chunkI <= resolution; chunkI++) {
    for (let ij = 1; ij < (resolution + 1.0 - chunkI) * 5.0; ij++) {
      if (ij % 5 === 0) continue; // Ignore intersection with horizontal rows
      const s = (chunkI * 5.0 + ij) / ((resolution + 1.0) * 5.0);
      const t = ij / ((resolution + 1.0) * 5.0);
      result.push(createTile(result.length, face, new Vector2(s, t)));
    }
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
  createEdgeTiles(result, resolution, icosahedron.faces[0], false);
  createEdgeTiles(result, resolution, icosahedron.faces[1], false);
  createEdgeTiles(result, resolution, icosahedron.faces[2], false);
  createEdgeTiles(result, resolution, icosahedron.faces[3], false);
  createEdgeTiles(result, resolution, icosahedron.faces[4], false);

  // Horizontal
  createEdgeTiles(result, resolution, icosahedron.faces[5], true);
  createEdgeTiles(result, resolution, icosahedron.faces[7], true);
  createEdgeTiles(result, resolution, icosahedron.faces[9], true);
  createEdgeTiles(result, resolution, icosahedron.faces[11], true);
  createEdgeTiles(result, resolution, icosahedron.faces[13], true);

  // Diagonal
  createEdgeTiles(result, resolution, icosahedron.faces[5], false);
  createEdgeTiles(result, resolution, icosahedron.faces[6], true);
  createEdgeTiles(result, resolution, icosahedron.faces[7], false);
  createEdgeTiles(result, resolution, icosahedron.faces[8], true);
  createEdgeTiles(result, resolution, icosahedron.faces[9], false);
  createEdgeTiles(result, resolution, icosahedron.faces[10], true);
  createEdgeTiles(result, resolution, icosahedron.faces[11], false);
  createEdgeTiles(result, resolution, icosahedron.faces[12], true);
  createEdgeTiles(result, resolution, icosahedron.faces[13], false);
  createEdgeTiles(result, resolution, icosahedron.faces[14], true);

  // Horizontal
  createEdgeTiles(result, resolution, icosahedron.faces[6], false);
  createEdgeTiles(result, resolution, icosahedron.faces[8], false);
  createEdgeTiles(result, resolution, icosahedron.faces[10], false);
  createEdgeTiles(result, resolution, icosahedron.faces[12], false);
  createEdgeTiles(result, resolution, icosahedron.faces[14], false);

  // Diagonal
  createEdgeTiles(result, resolution, icosahedron.faces[15], true);
  createEdgeTiles(result, resolution, icosahedron.faces[16], true);
  createEdgeTiles(result, resolution, icosahedron.faces[17], true);
  createEdgeTiles(result, resolution, icosahedron.faces[18], true);
  createEdgeTiles(result, resolution, icosahedron.faces[19], true);

  for (let f = 0; f < icosahedron.faces.length; f++) {
    createTrussTiles(result, resolution, icosahedron.faces[f]);
  }

  console.assert(
    result.every((tile, i) => tile.index === i),
    "Tile indices incorrect!",
  );

  return result;
};
