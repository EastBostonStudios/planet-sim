import { Vector2 } from "three";
import {
  type IcosphereEdge,
  type IcosphereFace,
  type IcospherePoint,
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

  private readonly getEdgeTile = (edgeIndex: number, i: number) =>
    this.tiles[this.getEdgeTileIndex(edgeIndex, i)];

  private readonly getFaceTile = (faceIndex: number, i: number, j: number) =>
    this.tiles[this.getFaceTileIndex(faceIndex, i, j)];

  //----------------------------------------------------------------------------

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

  //----------------------------------------------------------------------------

  private readonly createFaceTris = (
    a: IcospherePoint,
    b: IcospherePoint,
    c: IcospherePoint,
    ab: IcosphereEdge,
    bc: IcosphereEdge,
    ca: IcosphereEdge,
    face: IcosphereFace,
  ) => {
    const maxIJ = (this.resolution + 1) * 5 - 1;

    const flipAB = face.index > 14;
    const flipBC = face.index > 4;

    const getTile = (f: number, i: number, j: number): GameBoardTile => {
      // Corners
      if (i === -1 && j === -1) return this.tiles[a.index];
      if (i === maxIJ && j === -1) return this.tiles[b.index];
      if (i === maxIJ && j === maxIJ) return this.tiles[c.index];

      // a -> b
      if (j < 0) return this.getEdgeTile(ab.index, flipAB ? maxIJ - i : i + 1);
      // b -> c
      if (i === maxIJ) return this.getEdgeTile(bc.index, maxIJ - j);
      // c -> a
      if (j === i)
        return this.getEdgeTile(ca.index, flipBC ? maxIJ - j : j + 1);

      // Default case
      return this.getFaceTile(f, i, j);
    };

    let index =
      face.index * ((this.resolution + 1) * (this.resolution + 1) * 25);

    // -1 represents off of the face tiles (connecting to the edge tiles)
    for (let i = -1; i < maxIJ; i++) {
      for (let j = -1; j <= i; j++) {
        if (j > -1) {
          const pa = getTile(face.index, i + 1, j);
          const pb = getTile(face.index, i, j);
          const pc = getTile(face.index, i, j - 1);
          this.tris[index] = { index, face, a: pa, b: pb, c: pc };
          index++;
        }
        const pa = getTile(face.index, i, j);
        const pb = getTile(face.index, i + 1, j);
        const pc = getTile(face.index, i + 1, j + 1);
        this.tris[index] = { index, face, a: pa, b: pb, c: pc };
        index++;
      }
    }
  };

  private readonly createTris = () => {
    const f = icosahedron.faces;
    const e = icosahedron.edges;
    const p = icosahedron.points;

    // Top row
    this.createFaceTris(p[0], p[1], p[2], e[0], e[5], e[1], f[0]);
    this.createFaceTris(p[0], p[2], p[3], e[1], e[6], e[2], f[1]);
    this.createFaceTris(p[0], p[3], p[4], e[2], e[7], e[3], f[2]);
    this.createFaceTris(p[0], p[4], p[5], e[3], e[8], e[4], f[3]);
    this.createFaceTris(p[0], p[5], p[1], e[4], e[9], e[0], f[4]);

    // Second row
    this.createFaceTris(p[1], p[6], p[2], e[10], e[11], e[5], f[5]);
    this.createFaceTris(p[6], p[7], p[2], e[20], e[12], e[11], f[6]);
    this.createFaceTris(p[2], p[7], p[3], e[12], e[13], e[6], f[7]);
    this.createFaceTris(p[7], p[8], p[3], e[21], e[14], e[13], f[8]);
    this.createFaceTris(p[3], p[8], p[4], e[14], e[15], e[7], f[9]);
    this.createFaceTris(p[8], p[9], p[4], e[22], e[16], e[15], f[10]);
    this.createFaceTris(p[4], p[9], p[5], e[16], e[17], e[8], f[11]);
    this.createFaceTris(p[9], p[10], p[5], e[23], e[18], e[17], f[12]);
    this.createFaceTris(p[5], p[10], p[7], e[18], e[19], e[9], f[13]);
    this.createFaceTris(p[10], p[6], p[1], e[24], e[10], e[19], f[14]);

    // Bottom row
    this.createFaceTris(p[11], p[7], p[6], e[26], e[20], e[25], f[15]);
    this.createFaceTris(p[11], p[8], p[7], e[27], e[21], e[26], f[16]);
    this.createFaceTris(p[11], p[9], p[8], e[28], e[22], e[27], f[17]);
    this.createFaceTris(p[11], p[10], p[9], e[29], e[23], e[28], f[18]);
    this.createFaceTris(p[11], p[6], p[10], e[25], e[24], e[29], f[19]);
  };

  //----------------------------------------------------------------------------

  /*
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

  private readonly addNeighbor = (
    tile: GameBoardTile,
    i: number,
    j: number,
  ) => {
    const neighbor = this.getFaceTile(tile.face.index, i, j);
    return tile.neighbors.push(neighbor);
  };

  private readonly stitchFaceTiles = (face: IcosphereFace) => {
    for (let i = 0; i < (this.resolution + 1) * 5 - 1; i++) {
      const isAtMinI = i === 0;
      const isAtMaxI = i === (this.resolution + 1) * 5 - 2;
      for (let j = 0; j < i - 1; j++) {
        const isAtMinJ = j === 0;
        const isAtMaxJ = j === i - 1;
        const tile = this.getFaceTile(face.index, i, j);
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
  */
}
