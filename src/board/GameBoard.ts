import { Vector2 } from "three";
import {
  type IcosphereEdge,
  type IcosphereFace,
  icosahedron,
} from "../icosphere/Icosahedron";
import { getTriangleNumber } from "../icosphere/utils";

export type GameBoardTile = {
  readonly index: number;
  readonly face: IcosphereFace;
  readonly neighbors: GameBoardTile[];
  readonly faceCoords: Vector2;
};

export type GameBoardTri = {
  readonly index: number;
  readonly face: IcosphereFace;
  readonly a: GameBoardTile;
  readonly b: GameBoardTile;
  readonly c: GameBoardTile;
};

export type GameBoardConnection = {
  readonly index: number;
  readonly start: GameBoardTile;
  readonly end: GameBoardTile;
};

//------------------------------------------------------------------------------

export class GameBoard {
  //----------------------------------------------------------------------------

  public readonly resolution: number;
  public readonly tiles: GameBoardTile[];
  public readonly tris: GameBoardTri[];
  public readonly connections: GameBoardConnection[];

  //----------------------------------------------------------------------------

  public constructor(resolution: number) {
    this.resolution = resolution;
    this.tiles = new Array<GameBoardTile>(
      // Preallocate space for all the tiles
      this.getFaceTileIndex(icosahedron.faces.length, 0, 0),
    );
    this.tris = new Array<GameBoardTri>(
      // Preallocate space for all the tris
      icosahedron.faces.length * ((resolution + 1) * (resolution + 1) * 25),
    );
    // TODO: Preallocate these arrays
    this.connections = new Array<GameBoardConnection>();

    this.createTiles();
    this.createTris();
    // this.createConnections();

    // for (let f = 0; f < icosahedron.faces.length; f++) {
    //  this.stitchFaceTiles(icosahedron.faces[f]);
    //}

    // stitchEdgeTiles(0, tiles[0], tiles[1], resolutionPlus1, tiles);
    // stitchEdgeTiles(1, tiles[0], tiles[2], 0, 1, resolutionPlus1, tiles);
    // stitchEdgeTiles(2, tiles[0], tiles[3], resolutionPlus1, tiles);
    // stitchEdgeTiles(3, tiles[0], tiles[4], resolutionPlus1, tiles);

    console.assert(
      this.tiles.every((tile, i) => tile.index === i),
      "Tile indices incorrect!",
    );
    console.assert(
      this.tris.every((chunk, i) => chunk.index === i),
      "Tri indices incorrect!",
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
    edge: IcosphereEdge,
    face: IcosphereFace,
    useBCEdge: boolean,
  ) => {
    for (let i = 1; i < (this.resolution + 1) * 5; i++) {
      const index = this.getEdgeTileIndex(edge.index, i);
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
    this.createEdgeTiles(icosahedron.edges[0], icosahedron.faces[0], false);
    this.createEdgeTiles(icosahedron.edges[1], icosahedron.faces[1], false);
    this.createEdgeTiles(icosahedron.edges[2], icosahedron.faces[2], false);
    this.createEdgeTiles(icosahedron.edges[3], icosahedron.faces[3], false);
    this.createEdgeTiles(icosahedron.edges[4], icosahedron.faces[4], false);

    // First horizontal edge row
    this.createEdgeTiles(icosahedron.edges[5], icosahedron.faces[5], true);
    this.createEdgeTiles(icosahedron.edges[6], icosahedron.faces[7], true);
    this.createEdgeTiles(icosahedron.edges[7], icosahedron.faces[9], true);
    this.createEdgeTiles(icosahedron.edges[8], icosahedron.faces[11], true);
    this.createEdgeTiles(icosahedron.edges[9], icosahedron.faces[13], true);

    // Diagonal edges
    this.createEdgeTiles(icosahedron.edges[10], icosahedron.faces[5], false);
    this.createEdgeTiles(icosahedron.edges[11], icosahedron.faces[6], true);
    this.createEdgeTiles(icosahedron.edges[12], icosahedron.faces[7], false);
    this.createEdgeTiles(icosahedron.edges[13], icosahedron.faces[8], true);
    this.createEdgeTiles(icosahedron.edges[14], icosahedron.faces[9], false);
    this.createEdgeTiles(icosahedron.edges[15], icosahedron.faces[10], true);
    this.createEdgeTiles(icosahedron.edges[16], icosahedron.faces[11], false);
    this.createEdgeTiles(icosahedron.edges[17], icosahedron.faces[12], true);
    this.createEdgeTiles(icosahedron.edges[18], icosahedron.faces[13], false);
    this.createEdgeTiles(icosahedron.edges[19], icosahedron.faces[14], true);

    // Second horizontal edge row
    this.createEdgeTiles(icosahedron.edges[20], icosahedron.faces[6], false);
    this.createEdgeTiles(icosahedron.edges[21], icosahedron.faces[8], false);
    this.createEdgeTiles(icosahedron.edges[22], icosahedron.faces[10], false);
    this.createEdgeTiles(icosahedron.edges[23], icosahedron.faces[12], false);
    this.createEdgeTiles(icosahedron.edges[24], icosahedron.faces[14], false);

    // Diagonal edges ending at p11
    this.createEdgeTiles(icosahedron.edges[25], icosahedron.faces[15], true);
    this.createEdgeTiles(icosahedron.edges[26], icosahedron.faces[16], true);
    this.createEdgeTiles(icosahedron.edges[27], icosahedron.faces[17], true);
    this.createEdgeTiles(icosahedron.edges[28], icosahedron.faces[18], true);
    this.createEdgeTiles(icosahedron.edges[29], icosahedron.faces[19], true);

    // Tiles for each icosahedron face
    for (let f = 0; f < icosahedron.faces.length; f++) {
      this.createFaceTiles(icosahedron.faces[f]);
    }
  };

  private readonly createConnections = () => {
    for (let edgeIndex = 0; edgeIndex < 30; edgeIndex++) {
      for (let i = 1; i < (this.resolution + 1) * 5; i++) {
        const index =
          12 + edgeIndex * ((this.resolution + 1) * 5 - 1) + (i - 1);
        const start = i === 1 ? null : this.tiles[index];
        const end =
          i === (this.resolution + 1) * 5 - 1 ? null : this.tiles[index + 1];
        if (!!start && !!end) this.connections.push({ index, start, end });
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly addNeighbor = (
    tile: GameBoardTile,
    i: number,
    j: number,
  ) => {
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

  private readonly creatTris = (
    face: IcosphereFace,
    a: GameBoardTile,
    b: GameBoardTile,
    c: GameBoardTile,
    ab: number,
    bc: number,
    ca: number,
    flipAB?: boolean,
    flipBC?: boolean,
  ) => {
    const getTile = (
      f: number,
      i: number,
      j: number,
      flipAB?: boolean,
      flipBC?: boolean,
    ) => {
      const maxIJ = (this.resolution + 1) * 5 - 1;

      // Corners
      if (i === -1 && j === -1) return a;
      if (i === maxIJ && j === -1) return b;
      if (i === maxIJ && j === maxIJ) return c;

      // a -> b
      if (j < 0) {
        if (flipAB) return this.tiles[this.getEdgeTileIndex(ab, maxIJ - i)];
        return this.tiles[this.getEdgeTileIndex(ab, i + 1)];
      }

      // b -> c
      if (i === maxIJ) return this.tiles[this.getEdgeTileIndex(bc, maxIJ - j)];

      // c -> a
      if (j === i) {
        if (flipBC) return this.tiles[this.getEdgeTileIndex(ca, maxIJ - j)];
        return this.tiles[this.getEdgeTileIndex(ca, j + 1)];
      }

      // Default case
      return this.tiles[this.getFaceTileIndex(f, i, j)];
    };

    let index =
      face.index * ((this.resolution + 1) * (this.resolution + 1) * 25);

    // -1 represents off of the face tiles (connecting to the edge tiles)
    for (let i = -1; i < (this.resolution + 1) * 5 - 1; i++) {
      for (let j = -1; j <= i; j++) {
        if (j > -1) {
          const a = getTile(face.index, i + 1, j, flipAB, flipBC);
          const b = getTile(face.index, i, j, flipAB, flipBC);
          const c = getTile(face.index, i, j - 1, flipAB, flipBC);
          this.tris[index] = { index, face, a, b, c };
          index++;
        }
        const a = getTile(face.index, i, j, flipAB, flipBC);
        const b = getTile(face.index, i + 1, j, flipAB, flipBC);
        const c = getTile(face.index, i + 1, j + 1, flipAB, flipBC);
        this.tris[index] = { index, face, a, b, c };
        index++;
      }
    }
  };

  private readonly createTris = () => {
    const [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11] = this.tiles;

    // Top row
    this.creatTris(icosahedron.faces[0], t0, t1, t2, 0, 5, 1);
    this.creatTris(icosahedron.faces[1], t0, t2, t3, 1, 6, 2);
    this.creatTris(icosahedron.faces[2], t0, t3, t4, 2, 7, 3);
    this.creatTris(icosahedron.faces[3], t0, t4, t5, 3, 8, 4);
    this.creatTris(icosahedron.faces[4], t0, t5, t1, 4, 9, 0);

    // Second row
    this.creatTris(icosahedron.faces[5], t1, t6, t2, 10, 11, 5, false, true);
    this.creatTris(icosahedron.faces[6], t6, t7, t2, 20, 12, 11, false, true);
    this.creatTris(icosahedron.faces[7], t2, t7, t3, 12, 13, 6, false, true);
    this.creatTris(icosahedron.faces[8], t7, t8, t3, 21, 14, 13, false, true);
    this.creatTris(icosahedron.faces[9], t3, t8, t4, 14, 15, 7, false, true);
    this.creatTris(icosahedron.faces[10], t8, t9, t4, 22, 16, 15, false, true);
    this.creatTris(icosahedron.faces[11], t4, t9, t5, 16, 17, 8, false, true);
    this.creatTris(icosahedron.faces[12], t9, t10, t5, 23, 18, 17, false, true);
    this.creatTris(icosahedron.faces[13], t5, t10, t7, 18, 19, 9, false, true);
    this.creatTris(icosahedron.faces[14], t10, t6, t1, 24, 10, 19, false, true);

    // Bottom row
    this.creatTris(icosahedron.faces[15], t11, t7, t6, 26, 20, 25, true, true);
    this.creatTris(icosahedron.faces[16], t11, t8, t7, 27, 21, 26, true, true);
    this.creatTris(icosahedron.faces[17], t11, t9, t8, 28, 22, 27, true, true);
    this.creatTris(icosahedron.faces[18], t11, t10, t9, 29, 23, 28, true, true);
    this.creatTris(icosahedron.faces[19], t11, t6, t10, 25, 24, 29, true, true);
  };
}
