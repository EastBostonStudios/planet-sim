import { Vector2 } from "three";
import { type IcosphereFace, icosahedron } from "../icosphere/Icosahedron";
import { getTriangleNumber } from "../icosphere/utils";

export type GameTile = {
  readonly index: number;
  readonly face: IcosphereFace;
  readonly neighbors: GameTile[];
  readonly faceCoords: Vector2;
};

export type GameChunk = {
  readonly index: number;
  readonly face: IcosphereFace;
  readonly faceCoords: {
    readonly a: Vector2;
    readonly b: Vector2;
    readonly c: Vector2;
  };
};

//------------------------------------------------------------------------------

export class GameBoard {
  //----------------------------------------------------------------------------

  public readonly resolution: number;
  public readonly tiles: GameTile[];
  public readonly chunks: GameChunk[];

  //----------------------------------------------------------------------------

  public constructor(resolution: number) {
    this.resolution = resolution;
    this.tiles = new Array<GameTile>(
      // Preallocate space for all the tiles
      this.getFaceTileIndex(icosahedron.faces.length, 0, 0),
    );
    this.chunks = new Array<GameChunk>();

    this.createTiles();
    this.createChunks();

    for (let f = 0; f < icosahedron.faces.length; f++) {
      this.stitchFaceTiles(icosahedron.faces[f]);
    }

    // stitchEdgeTiles(0, tiles[0], tiles[1], resolutionPlus1, tiles);
    // stitchEdgeTiles(1, tiles[0], tiles[2], 0, 1, resolutionPlus1, tiles);
    // stitchEdgeTiles(2, tiles[0], tiles[3], resolutionPlus1, tiles);
    // stitchEdgeTiles(3, tiles[0], tiles[4], resolutionPlus1, tiles);

    console.assert(
      this.tiles.every((tile, i) => tile.index === i),
      "Tile indices incorrect!",
    );
    console.assert(
      this.chunks.every((chunk, i) => chunk.index === i),
      "Chunk indices incorrect!",
    );
  }

  //----------------------------------------------------------------------------

  private readonly getEdgeTileIndex = (edgeIndex: number, i: number) =>
    12 + edgeIndex * ((this.resolution + 1) * 5 - 1) + (i - 1);

  private readonly getFaceTileIndex = (
    faceIndex: number,
    i: number,
    j: number,
  ) => {
    if (i < 0 || i > (this.resolution + 1) * 5 - 2)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    if (j < 0 || j > i || j > (this.resolution + 1) * 5 - 2)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    return (
      12 +
      30 * ((this.resolution + 1) * 5 - 1) +
      faceIndex * getTriangleNumber((this.resolution + 1) * 5 - 2) +
      getTriangleNumber(i - 1) +
      j
    );
  };

  private readonly createTile = (
    index: number,
    face: IcosphereFace,
    faceCoords: Vector2,
  ) => {
    this.tiles[index] = { index, neighbors: [], face, faceCoords };
  };

  private readonly createEdgeTiles = (
    edgeIndex: number,
    face: IcosphereFace,
    useBCEdge: boolean,
  ) => {
    for (let i = 1; i < (this.resolution + 1) * 5; i++) {
      const index = this.getEdgeTileIndex(edgeIndex, i);
      const s = i / ((this.resolution + 1) * 5.0);
      const faceCoords = useBCEdge
        ? new Vector2(1.0 - s, 1.0 - s)
        : new Vector2(s, 0.0);
      this.createTile(index, face, faceCoords);
    }
  };

  private readonly createFaceTiles = (face: IcosphereFace) => {
    for (let i = 0; i < (this.resolution + 1) * 5 - 1; i++) {
      for (let j = 0; j < i; j++) {
        const index = this.getFaceTileIndex(face.index, i, j);
        const s = (i + 1.0) / ((this.resolution + 1) * 5.0);
        const t = (j + 1.0) / ((this.resolution + 1) * 5.0);
        this.createTile(index, face, new Vector2(s, t));
      }
    }
  };

  private readonly createTiles = () => {
    // Pentagonal tiles at the twelve icosahedron points
    this.createTile(0, icosahedron.faces[0], new Vector2(0.0, 0.0));
    this.createTile(1, icosahedron.faces[0], new Vector2(1.0, 0.0));
    this.createTile(2, icosahedron.faces[1], new Vector2(1.0, 0.0));
    this.createTile(3, icosahedron.faces[2], new Vector2(1.0, 0.0));
    this.createTile(4, icosahedron.faces[3], new Vector2(1.0, 0.0));
    this.createTile(5, icosahedron.faces[4], new Vector2(1.0, 0.0));
    this.createTile(6, icosahedron.faces[6], new Vector2(0.0, 0.0));
    this.createTile(7, icosahedron.faces[8], new Vector2(0.0, 0.0));
    this.createTile(8, icosahedron.faces[10], new Vector2(0.0, 0.0));
    this.createTile(9, icosahedron.faces[12], new Vector2(0.0, 0.0));
    this.createTile(10, icosahedron.faces[14], new Vector2(0.0, 0.0));
    this.createTile(11, icosahedron.faces[19], new Vector2(0.0, 0.0));

    // Diagonal edges starting at p0
    this.createEdgeTiles(0, icosahedron.faces[0], false);
    this.createEdgeTiles(1, icosahedron.faces[1], false);
    this.createEdgeTiles(2, icosahedron.faces[2], false);
    this.createEdgeTiles(3, icosahedron.faces[3], false);
    this.createEdgeTiles(4, icosahedron.faces[4], false);

    // First horizontal edge row
    this.createEdgeTiles(5, icosahedron.faces[5], true);
    this.createEdgeTiles(6, icosahedron.faces[7], true);
    this.createEdgeTiles(7, icosahedron.faces[9], true);
    this.createEdgeTiles(8, icosahedron.faces[11], true);
    this.createEdgeTiles(9, icosahedron.faces[13], true);

    // Diagonal edges
    this.createEdgeTiles(10, icosahedron.faces[5], false);
    this.createEdgeTiles(11, icosahedron.faces[6], true);
    this.createEdgeTiles(12, icosahedron.faces[7], false);
    this.createEdgeTiles(13, icosahedron.faces[8], true);
    this.createEdgeTiles(14, icosahedron.faces[9], false);
    this.createEdgeTiles(15, icosahedron.faces[10], true);
    this.createEdgeTiles(16, icosahedron.faces[11], false);
    this.createEdgeTiles(17, icosahedron.faces[12], true);
    this.createEdgeTiles(18, icosahedron.faces[13], false);
    this.createEdgeTiles(19, icosahedron.faces[14], true);

    // Second horizontal edge row
    this.createEdgeTiles(20, icosahedron.faces[6], false);
    this.createEdgeTiles(21, icosahedron.faces[8], false);
    this.createEdgeTiles(22, icosahedron.faces[10], false);
    this.createEdgeTiles(23, icosahedron.faces[12], false);
    this.createEdgeTiles(24, icosahedron.faces[14], false);

    // Diagonal edges ending at p11
    this.createEdgeTiles(25, icosahedron.faces[15], true);
    this.createEdgeTiles(26, icosahedron.faces[16], true);
    this.createEdgeTiles(27, icosahedron.faces[17], true);
    this.createEdgeTiles(28, icosahedron.faces[18], true);
    this.createEdgeTiles(29, icosahedron.faces[19], true);

    // Tiles for each icosahedron face
    for (let f = 0; f < icosahedron.faces.length; f++) {
      this.createFaceTiles(icosahedron.faces[f]);
    }
  };

  //----------------------------------------------------------------------------

  private readonly addNeighbor = (tile: GameTile, i: number, j: number) => {
    const neighborIndex = this.getFaceTileIndex(tile.face.index, i, j);
    const neighbor = this.tiles[neighborIndex];
    return tile.neighbors.push(neighbor);
  };

  private readonly stitchFaceTiles = (face: IcosphereFace) => {
    for (let i = 0; i < (this.resolution + 1) * 5 - 1; i++) {
      const isAtMinI = i === 0;
      const isAtMaxI = i === (this.resolution + 1) * 5 - 2;
      for (let j = 0; j < i - 1; j++) {
        const isAtMinJ = j === 0;
        const isAtMaxJ = j === i - 1;
        const tile = this.tiles[this.getFaceTileIndex(face.index, i, j)];
        if (!isAtMinI) {
          this.addNeighbor(tile, i - 1, j);
          if (!isAtMinJ) this.addNeighbor(tile, i - 1, j - 1);
        }
        if (!isAtMinJ) this.addNeighbor(tile, i, j - 1);
        if (!isAtMaxI) {
          this.addNeighbor(tile, i + 1, j);
          if (!isAtMaxJ) this.addNeighbor(tile, i + 1, j + 1);
        }
        if (!isAtMaxI) this.addNeighbor(tile, i, j + 1);
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly createChunks = () => {
    let index = 0;
    for (let f = 0; f < icosahedron.faces.length; f++) {
      const face = icosahedron.faces[f];
      for (let y = 0; y < this.resolution + 1; y++) {
        // noinspection PointlessArithmeticExpressionJS
        for (let x = y + 0; x < this.resolution + 1; x++) {
          const p00 = new Vector2(
            x / (this.resolution + 1.0),
            y / (this.resolution + 1.0),
          );
          const p10 = new Vector2(
            (x + 1.0) / (this.resolution + 1.0),
            y / (this.resolution + 1.0),
          );
          const p11 = new Vector2(
            (x + 1) / (this.resolution + 1.0),
            (y + 1) / (this.resolution + 1.0),
          );
          const mod = index % 3;
          this.chunks.push({
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
        for (let x = y + 1; x < this.resolution + 1; x++) {
          const p00 = new Vector2(
            x / (this.resolution + 1.0),
            y / (this.resolution + 1.0),
          );
          const p01 = new Vector2(
            x / (this.resolution + 1.0),
            (y + 1.0) / (this.resolution + 1.0),
          );
          const p11 = new Vector2(
            (x + 1.0) / (this.resolution + 1.0),
            (y + 1.0) / (this.resolution + 1.0),
          );
          const mod = index % 3;
          this.chunks.push({
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
  };
}

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
