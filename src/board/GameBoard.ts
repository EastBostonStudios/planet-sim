import { Vector2 } from "three";
import {
  type IcosphereEdge,
  type IcosphereFace,
  icosahedron,
  p00,
  p11,
} from "../icosphere/Icosahedron";
import { getTriangleNumber } from "../icosphere/utils";

const chunkSize = 15;

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

export type GameBoardChunk = {
  readonly index: number;
  readonly face: IcosphereFace;
  readonly tris: GameBoardTri[];
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
  public readonly chunks: GameBoardChunk[];
  public readonly connections: GameBoardConnection[];

  //----------------------------------------------------------------------------

  public constructor(resolution: number) {
    // Initialize variables and pre-allocate space for the arrays
    this.resolution = resolution;
    this.tiles = new Array<GameBoardTile>(
      this.getFaceTileIndex(icosahedron.faces.length, 0, 0),
    );
    this.tris = new Array<GameBoardTri>(
      icosahedron.faces.length *
        ((resolution + 1) * (resolution + 1) * chunkSize * chunkSize),
    );
    this.chunks = new Array<GameBoardChunk>(
      icosahedron.faces.length * (resolution + 1) * (resolution + 1),
    );
    // TODO: Preallocate these arrays
    this.connections = new Array<GameBoardConnection>();

    const f = icosahedron.faces;
    const e = icosahedron.edges;

    // Pentagonal tiles at the twelve icosahedron points
    this.createTile(0, f[0], new Vector2(0.0, 0.0));
    this.createTile(1, f[0], new Vector2(1.0, 0.0));
    this.createTile(2, f[1], new Vector2(1.0, 0.0));
    this.createTile(3, f[2], new Vector2(1.0, 0.0));
    this.createTile(4, f[3], new Vector2(1.0, 0.0));
    this.createTile(5, f[4], new Vector2(1.0, 0.0));
    this.createTile(6, f[6], new Vector2(0.0, 0.0));
    this.createTile(7, f[8], new Vector2(0.0, 0.0));
    this.createTile(8, f[10], new Vector2(0.0, 0.0));
    this.createTile(9, f[12], new Vector2(0.0, 0.0));
    this.createTile(10, f[14], new Vector2(0.0, 0.0));
    this.createTile(11, f[19], new Vector2(0.0, 0.0));

    // Diagonal edges starting at p0
    this.createEdgeTiles(e[0], f[0], false);
    this.createEdgeTiles(e[1], f[1], false);
    this.createEdgeTiles(e[2], f[2], false);
    this.createEdgeTiles(e[3], f[3], false);
    this.createEdgeTiles(e[4], f[4], false);

    // First horizontal edge row
    this.createEdgeTiles(e[5], f[5], true);
    this.createEdgeTiles(e[6], f[7], true);
    this.createEdgeTiles(e[7], f[9], true);
    this.createEdgeTiles(e[8], f[11], true);
    this.createEdgeTiles(e[9], f[13], true);

    // Diagonal edges
    this.createEdgeTiles(e[10], f[5], false);
    this.createEdgeTiles(e[11], f[6], true);
    this.createEdgeTiles(e[12], f[7], false);
    this.createEdgeTiles(e[13], f[8], true);
    this.createEdgeTiles(e[14], f[9], false);
    this.createEdgeTiles(e[15], f[10], true);
    this.createEdgeTiles(e[16], f[11], false);
    this.createEdgeTiles(e[17], f[12], true);
    this.createEdgeTiles(e[18], f[13], false);
    this.createEdgeTiles(e[19], f[14], true);

    // Second horizontal edge row
    this.createEdgeTiles(e[20], f[6], false);
    this.createEdgeTiles(e[21], f[8], false);
    this.createEdgeTiles(e[22], f[10], false);
    this.createEdgeTiles(e[23], f[12], false);
    this.createEdgeTiles(e[24], f[14], false);

    // Diagonal edges ending at p11
    this.createEdgeTiles(e[25], f[15], true, true);
    this.createEdgeTiles(e[26], f[16], true, true);
    this.createEdgeTiles(e[27], f[17], true, true);
    this.createEdgeTiles(e[28], f[18], true, true);
    this.createEdgeTiles(e[29], f[19], true, true);

    // Tiles for each icosahedron face
    for (let f = 0; f < icosahedron.faces.length; f++) {
      this.createFaceTiles(icosahedron.faces[f]);
    }

    // Top row
    this.createFaceTris(f[0]);
    this.createFaceTris(f[1]);
    this.createFaceTris(f[2]);
    this.createFaceTris(f[3]);
    this.createFaceTris(f[4]);

    // Second row
    this.createFaceTris(f[5]);
    this.createFaceTris(f[6]);
    this.createFaceTris(f[7]);
    this.createFaceTris(f[8]);
    this.createFaceTris(f[9]);
    this.createFaceTris(f[10]);
    this.createFaceTris(f[11]);
    this.createFaceTris(f[12]);
    this.createFaceTris(f[13]);
    this.createFaceTris(f[14]);

    // Bottom row
    this.createFaceTris(f[15]);
    this.createFaceTris(f[16]);
    this.createFaceTris(f[17]);
    this.createFaceTris(f[18]);
    this.createFaceTris(f[19]);

    this.validate();
  }

  //----------------------------------------------------------------------------

  private readonly getEdgeTileIndex = (edgeIndex: number, i: number) => {
    if (i < 0 || i > (this.resolution + 1) * chunkSize)
      throw new Error(`${i} out of bounds!`);
    return 12 + edgeIndex * ((this.resolution + 1) * chunkSize - 1) + (i - 1);
  };

  private readonly getFaceTileIndex = (
    faceIndex: number,
    i: number,
    j: number,
  ) => {
    if (i < 0 || i > (this.resolution + 1) * chunkSize - 2)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    if (j < 0 || j > i || j > (this.resolution + 1) * chunkSize - 2)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    return (
      12 +
      30 * ((this.resolution + 1) * chunkSize - 1) +
      faceIndex * getTriangleNumber((this.resolution + 1) * chunkSize - 2) +
      getTriangleNumber(i - 1) +
      j
    );
  };

  private readonly getEdgeTile = (edge: IcosphereEdge, i: number) =>
    this.tiles[this.getEdgeTileIndex(edge.index, i)];

  private readonly getFaceTile = (face: IcosphereFace, i: number, j: number) =>
    this.tiles[this.getFaceTileIndex(face.index, i, j)];

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
    useCAEdge?: boolean,
  ) => {
    for (let i = 1; i < (this.resolution + 1) * chunkSize; i++) {
      const index = this.getEdgeTileIndex(edge.index, i);
      const s = i / ((this.resolution + 1) * chunkSize);
      const faceCoords = useCAEdge
        ? new Vector2(s, s)
        : useBCEdge
          ? new Vector2(1.0 - s, 1.0 - s)
          : new Vector2(s, 0.0);
      this.createTile(index, face, faceCoords);
    }
  };

  private readonly createFaceTiles = (face: IcosphereFace) => {
    for (let i = 0; i < (this.resolution + 1) * chunkSize - 1; i++) {
      for (let j = 0; j < i; j++) {
        const index = this.getFaceTileIndex(face.index, i, j);
        const s = (i + 1.0) / ((this.resolution + 1) * chunkSize);
        const t = (j + 1.0) / ((this.resolution + 1) * chunkSize);
        this.createTile(index, face, new Vector2(s, t));
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly getTile = (
    face: IcosphereFace,
    i: number,
    j: number,
  ): GameBoardTile => {
    const maxIJ = (this.resolution + 1) * chunkSize - 1;

    // Corners
    if (i === -1 && j === -1) return this.tiles[face.a.index];
    if (i === maxIJ && j === -1) return this.tiles[face.b.index];
    if (i === maxIJ && j === maxIJ) return this.tiles[face.c.index];

    const isPolar = face.a === p00 || face.a === p11;
    const ab = isPolar ? face.e0 : face.e1;
    const bc = isPolar ? face.e1 : face.e0;
    const ca = face.e2;
    const flipCA = !isPolar;

    if (j < 0) return this.getEdgeTile(ab, i + 1); // a -> b
    if (i === maxIJ) return this.getEdgeTile(bc, maxIJ - j); // b -> c
    if (j === i) return this.getEdgeTile(ca, flipCA ? maxIJ - j : j + 1); // c -> a

    // Default case
    return this.getFaceTile(face, i, j);
  };

  private readonly createFaceTris = (face: IcosphereFace) => {
    const chunksPerFace = (this.resolution + 1) * (this.resolution + 1);
    for (let c = 0; c < chunksPerFace; c++) {
      const index = face.index * chunksPerFace + c;
      const tris = new Array(chunkSize * chunkSize);
      this.chunks[index] = { index, face, tris };
    }

    let index = face.index * (chunksPerFace * chunkSize * chunkSize);

    for (let i = 0; i <= (this.resolution + 1) * chunkSize - 1; i++) {
      const chunkI = Math.trunc(i / chunkSize);
      const iOnChunk = i % chunkSize;

      for (let j = 0; j <= i; j++) {
        const chunkJ = Math.trunc(j / chunkSize);
        const jOnChunk = j % chunkSize;

        const chunkIndex =
          face.index * chunksPerFace + chunkI * chunkI + chunkJ * 2;

        if (j < i) {
          // -1 represents off of the face tiles (connecting to the edge tiles)
          const pa = this.getTile(face, i, j);
          const pb = this.getTile(face, i - 1, j);
          const pc = this.getTile(face, i - 1, j - 1);
          const tri = { index, face, a: pa, b: pb, c: pc };
          this.tris[index] = tri;

          // Check if this sits on the flipped chunk or not
          if (jOnChunk >= iOnChunk) {
            const triIndex = jOnChunk * jOnChunk + iOnChunk * 2;
            this.chunks[chunkIndex + 1].tris[triIndex] = tri;
          } else {
            const triIndex = iOnChunk * iOnChunk + jOnChunk * 2 + 1;
            this.chunks[chunkIndex].tris[triIndex] = tri;
          }
          index++;
        }

        const pa = this.getTile(face, i - 1, j - 1);
        const pb = this.getTile(face, i, j - 1);
        const pc = this.getTile(face, i, j);
        const tri = { index, face, a: pa, b: pb, c: pc };
        this.tris[index] = tri;

        // Check if this sits on the flipped chunk or not
        if (jOnChunk > iOnChunk) {
          const triIndex = jOnChunk * jOnChunk + iOnChunk * 2 + 1;
          this.chunks[chunkIndex + 1].tris[triIndex] = tri;
        } else {
          const triIndex = iOnChunk * iOnChunk + jOnChunk * 2;
          this.chunks[chunkIndex].tris[triIndex] = tri;
        }
        index++;
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly validate = () => {
    console.assert(
      this.tiles.every((tile, i) => tile.index === i),
      "Tile indices incorrect!",
    );
    console.assert(
      this.tris.every((tri, i) => tri.index === i),
      "Tri indices incorrect!",
    );
    console.assert(
      this.chunks.every((chunk, i) => chunk.index === i),
      "Chunk indices incorrect!",
    );
    console.assert(
      this.chunks.every((chunk) => {
        for (let i = 0; i < chunk.tris.length; ++i)
          if (!chunk.tris[i]) return false;
        return true;
      }),
      "Chunk missing tris!",
    );
  };
}
