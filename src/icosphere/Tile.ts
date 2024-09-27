import { Vector2 } from "three";
import type { Chunk } from "./Chunk";
import { type IcosphereFace, icosahedron } from "./Icosahedron";
import { getTriangleNumber } from "./utils";

export type Tile = {
  index: number;
  face: IcosphereFace;
  neighbors: Tile[];
  faceCoords: Vector2;
};

//------------------------------------------------------------------------------

const getEdgeTileIndex = (
  resolutionPlus1: number,
  edgeIndex: number,
  i: number,
) => 12 + edgeIndex * (resolutionPlus1 * 5 - 1) + (i - 1);

const getFaceTileIndex = (
  resolutionPlus1: number,
  faceIndex: number,
  i: number,
  j: number,
) => {
  if (i < 1 || i >= resolutionPlus1 * 5)
    throw new Error(`(${i}, ${j}) out of bounds!`);
  if (j < 1 || j > i || j >= resolutionPlus1 * 5)
    throw new Error(`(${i}, ${j}) out of bounds!`);
  return (
    getEdgeTileIndex(resolutionPlus1, 30, 0) +
    faceIndex * getTriangleNumber(resolutionPlus1 * 5 - 2) +
    getTriangleNumber(i - 2) +
    j
  );
};

//------------------------------------------------------------------------------

const createTile = (
  index: number,
  face: IcosphereFace,
  faceCoords: Vector2,
): Tile => ({ index, neighbors: [], face, faceCoords });

const createEdgeTiles = (
  edgeIndex: number,
  tiles: Array<Tile>,
  resolutionPlus1: number,
  face: IcosphereFace,
  useB: boolean,
) => {
  for (let i = 1; i < resolutionPlus1 * 5; i++) {
    const index = getEdgeTileIndex(resolutionPlus1, edgeIndex, i);
    const s = i / (resolutionPlus1 * 5.0);
    const faceCoords = useB
      ? new Vector2(1.0 - s, 1.0 - s)
      : new Vector2(s, 0.0);
    tiles.push(createTile(index, face, faceCoords));
  }
};

/*
const stitchEdgeTiles = (
  edgeIndex: number,
  startTile: Tile,
  endTile: Tile,
  leftFace: number,
  rightFace: number,
  resolutionPlus1: number,
  tiles: Array<Tile>,
) => {
  for (let i = 1; i < resolutionPlus1 * 5; i++) {
    const index = 12 + edgeIndex * (resolutionPlus1 * 5 - 1) + (i - 1);
    const back = i === 1 ? startTile : tiles[index - 1];

    const front = i === resolutionPlus1 * 5 - 1 ? endTile : tiles[index + 1];
    tiles[index].neighbors.push(back, front);
  }
};
*/

const createFaceTiles = (
  tiles: Array<Tile>,
  resolutionPlus1: number,
  face: IcosphereFace,
) => {
  for (let i = 1; i < resolutionPlus1 * 5; i++) {
    for (let j = 1; j < i; j++) {
      const index = getFaceTileIndex(resolutionPlus1, face.index, i, j);
      const s = i / (resolutionPlus1 * 5.0);
      const t = j / (resolutionPlus1 * 5.0);
      tiles.push(createTile(index, face, new Vector2(s, t)));
    }
  }
};

//------------------------------------------------------------------------------

const addNeighbor = (
  resolutionPlus1: number,
  tiles: ReadonlyArray<Tile>,
  tile: Tile,
  i: number,
  j: number,
) => {
  const neighbor =
    tiles[getFaceTileIndex(resolutionPlus1, tile.face.index, i, j)];
  console.assert(neighbor.face === tile.face);
  return tile.neighbors.push(neighbor);
};

const stitchFaceTiles = (
  tiles: Array<Tile>,
  resolutionPlus1: number,
  face: IcosphereFace,
) => {
  for (let i = 1; i < resolutionPlus1 * 5 - 1; i++) {
    for (let j = 1; j < i; j++) {
      const isAtMinI = i === 1;
      const isAtMaxI = i === resolutionPlus1 * 5 - 1;
      const isAtMinJ = j === 1;
      const isAtMaxJ = j === i;

      const tile = tiles[getFaceTileIndex(resolutionPlus1, face.index, i, j)];
      if (i > 1) {
        addNeighbor(resolutionPlus1, tiles, tile, i - 1, j);
      }

      /*
      if (!isAtMinJ) {
         if (!isAtMinI) addNeighbor(resolutionPlus1, tiles, tile, i - 1, j - 1);
        addNeighbor(resolutionPlus1, tiles, tile, i, j - 1);
      }
      */
      //if (!isAtMaxI) addNeighbor(resolutionPlus1, tiles, tile, i + 1, j);
      /*
      if (!isAtMaxJ) {
        if (!isAtMaxI) addNeighbor(resolutionPlus1, tiles, tile, i + 1, j + 1);
        addNeighbor(resolutionPlus1, tiles, tile, i, j + 1);
      }*/

      /*
      if (i < maxI - 1)
        addNeighbor(resolutionPlus1, tiles, tile, i + 1, j - 1);*/
      //if (i > 1) addNeighbor(resolutionPlus1, tiles, tile, i - 1, j + 1);
    }
  }
};

export const getTiles = (
  resolution: number,
): { tiles: ReadonlyArray<Tile>; chunks: ReadonlyArray<Chunk> } => {
  const resolutionPlus1 = resolution + 1;
  const chunks = new Array<Chunk>();
  let index = 0;
  for (let f = 0; f < icosahedron.faces.length; f++) {
    const face = icosahedron.faces[f];
    for (let y = 0; y < resolutionPlus1; y++) {
      // noinspection PointlessArithmeticExpressionJS
      for (let x = y + 0; x < resolutionPlus1; x++) {
        const p00 = new Vector2(x / resolutionPlus1, y / resolutionPlus1);
        const p10 = new Vector2((x + 1) / resolutionPlus1, y / resolutionPlus1);
        const p11 = new Vector2(
          (x + 1) / resolutionPlus1,
          (y + 1) / resolutionPlus1,
        );
        const mod = index % 3;
        chunks.push({
          index: index++,
          face,
          faceCoords:
            mod === 0
              ? { a: p00, b: p10, c: p11 }
              : mod === 1
                ? { a: p11, b: p00, c: p10 }
                : { a: p10, b: p11, c: p00 },
        });
      }
      for (let x = y + 1; x < resolutionPlus1; x++) {
        const p00 = new Vector2(x / resolutionPlus1, y / resolutionPlus1);
        const p01 = new Vector2(x / resolutionPlus1, (y + 1) / resolutionPlus1);
        const p11 = new Vector2(
          (x + 1) / resolutionPlus1,
          (y + 1) / resolutionPlus1,
        );
        const mod = index % 3;
        chunks.push({
          index: index++,
          face,
          faceCoords:
            mod === 0
              ? { a: p11, b: p01, c: p00 }
              : mod === 1
                ? { a: p00, b: p11, c: p01 }
                : { a: p01, b: p00, c: p11 },
        });
      }
    }
  }

  const tiles = new Array<Tile>();

  tiles.push(
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
  createEdgeTiles(0, tiles, resolutionPlus1, icosahedron.faces[0], false);
  createEdgeTiles(1, tiles, resolutionPlus1, icosahedron.faces[1], false);
  createEdgeTiles(2, tiles, resolutionPlus1, icosahedron.faces[2], false);
  createEdgeTiles(3, tiles, resolutionPlus1, icosahedron.faces[3], false);
  createEdgeTiles(4, tiles, resolutionPlus1, icosahedron.faces[4], false);

  // Horizontal
  createEdgeTiles(5, tiles, resolutionPlus1, icosahedron.faces[5], true);
  createEdgeTiles(6, tiles, resolutionPlus1, icosahedron.faces[7], true);
  createEdgeTiles(7, tiles, resolutionPlus1, icosahedron.faces[9], true);
  createEdgeTiles(8, tiles, resolutionPlus1, icosahedron.faces[11], true);
  createEdgeTiles(9, tiles, resolutionPlus1, icosahedron.faces[13], true);

  // Diagonal
  createEdgeTiles(10, tiles, resolutionPlus1, icosahedron.faces[5], false);
  createEdgeTiles(11, tiles, resolutionPlus1, icosahedron.faces[6], true);
  createEdgeTiles(12, tiles, resolutionPlus1, icosahedron.faces[7], false);
  createEdgeTiles(13, tiles, resolutionPlus1, icosahedron.faces[8], true);
  createEdgeTiles(14, tiles, resolutionPlus1, icosahedron.faces[9], false);
  createEdgeTiles(15, tiles, resolutionPlus1, icosahedron.faces[10], true);
  createEdgeTiles(16, tiles, resolutionPlus1, icosahedron.faces[11], false);
  createEdgeTiles(17, tiles, resolutionPlus1, icosahedron.faces[12], true);
  createEdgeTiles(18, tiles, resolutionPlus1, icosahedron.faces[13], false);
  createEdgeTiles(19, tiles, resolutionPlus1, icosahedron.faces[14], true);

  // Horizontal
  createEdgeTiles(20, tiles, resolutionPlus1, icosahedron.faces[6], false);
  createEdgeTiles(21, tiles, resolutionPlus1, icosahedron.faces[8], false);
  createEdgeTiles(22, tiles, resolutionPlus1, icosahedron.faces[10], false);
  createEdgeTiles(23, tiles, resolutionPlus1, icosahedron.faces[12], false);
  createEdgeTiles(24, tiles, resolutionPlus1, icosahedron.faces[14], false);

  // Diagonal
  createEdgeTiles(25, tiles, resolutionPlus1, icosahedron.faces[15], true);
  createEdgeTiles(26, tiles, resolutionPlus1, icosahedron.faces[16], true);
  createEdgeTiles(27, tiles, resolutionPlus1, icosahedron.faces[17], true);
  createEdgeTiles(28, tiles, resolutionPlus1, icosahedron.faces[18], true);
  createEdgeTiles(29, tiles, resolutionPlus1, icosahedron.faces[19], true);

  for (let f = 0; f < icosahedron.faces.length; f++) {
    createFaceTiles(tiles, resolutionPlus1, icosahedron.faces[f]);
  }

  for (let f = 0; f < icosahedron.faces.length; f++) {
    stitchFaceTiles(tiles, resolutionPlus1, icosahedron.faces[f]);
  }

  // stitchEdgeTiles(0, tiles[0], tiles[1], resolutionPlus1, tiles);
  // stitchEdgeTiles(1, tiles[0], tiles[2], 0, 1, resolutionPlus1, tiles);
  //stitchEdgeTiles(2, tiles[0], tiles[3], resolutionPlus1, tiles);
  //stitchEdgeTiles(3, tiles[0], tiles[4], resolutionPlus1, tiles);

  console.assert(
    tiles.every((tile, i) => tile.index === i),
    "Tile indices incorrect!",
  );

  return { tiles, chunks };
};

/*

const createFaceTiles = (
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

 */
