import { Vector2 } from "three";
import {
  type IcosphereEdge,
  type IcosphereFace,
  icosahedron,
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
    this.createEdgeTiles(icosahedron.edges[0], icosahedron.faces[0]);
    this.createEdgeTiles(icosahedron.edges[1], icosahedron.faces[1]);
    this.createEdgeTiles(icosahedron.edges[2], icosahedron.faces[2]);
    this.createEdgeTiles(icosahedron.edges[3], icosahedron.faces[3]);
    this.createEdgeTiles(icosahedron.edges[4], icosahedron.faces[4]);

    // First horizontal edge row
    this.createEdgeTiles(icosahedron.edges[5], icosahedron.faces[5]);
    this.createEdgeTiles(icosahedron.edges[6], icosahedron.faces[7]);
    this.createEdgeTiles(icosahedron.edges[7], icosahedron.faces[9]);
    this.createEdgeTiles(icosahedron.edges[8], icosahedron.faces[11]);
    this.createEdgeTiles(icosahedron.edges[9], icosahedron.faces[13]);

    // Diagonal edges
    this.createEdgeTiles(icosahedron.edges[10], icosahedron.faces[5]);
    this.createEdgeTiles(icosahedron.edges[11], icosahedron.faces[6]);
    this.createEdgeTiles(icosahedron.edges[12], icosahedron.faces[7]);
    this.createEdgeTiles(icosahedron.edges[13], icosahedron.faces[8]);
    this.createEdgeTiles(icosahedron.edges[14], icosahedron.faces[9]);
    this.createEdgeTiles(icosahedron.edges[15], icosahedron.faces[10]);
    this.createEdgeTiles(icosahedron.edges[16], icosahedron.faces[11]);
    this.createEdgeTiles(icosahedron.edges[17], icosahedron.faces[12]);
    this.createEdgeTiles(icosahedron.edges[18], icosahedron.faces[13]);
    this.createEdgeTiles(icosahedron.edges[19], icosahedron.faces[14]);

    // Second horizontal edge row
    this.createEdgeTiles(icosahedron.edges[20], icosahedron.faces[6]);
    this.createEdgeTiles(icosahedron.edges[21], icosahedron.faces[8]);
    this.createEdgeTiles(icosahedron.edges[22], icosahedron.faces[10]);
    this.createEdgeTiles(icosahedron.edges[23], icosahedron.faces[12]);
    this.createEdgeTiles(icosahedron.edges[24], icosahedron.faces[14]);

    // Diagonal edges ending at p11
    this.createEdgeTiles(icosahedron.edges[25], icosahedron.faces[15]);
    this.createEdgeTiles(icosahedron.edges[26], icosahedron.faces[16]);
    this.createEdgeTiles(icosahedron.edges[27], icosahedron.faces[17]);
    this.createEdgeTiles(icosahedron.edges[28], icosahedron.faces[18]);
    this.createEdgeTiles(icosahedron.edges[29], icosahedron.faces[19]);

    // Create face tiles, chunks, and tris
    for (let f = 0; f < icosahedron.faces.length; f++) {
      this.populateFace(icosahedron.faces[f]);
    }

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
  ) => {
    for (let i = 1; i < (this.resolution + 1) * chunkSize; i++) {
      const index = this.getEdgeTileIndex(edge.index, i);
      const s = i / ((this.resolution + 1) * chunkSize);
      if (edge.index > 24) {
        const faceCoords = new Vector2(s, s);
        this.createTile(index, face, faceCoords);
      } else if (
        edge.index >= 5 &&
        edge.index < 20 &&
        (edge.index < 10 || edge.index % 2 === 1)
      ) {
        const faceCoords = new Vector2(1.0 - s, 1.0 - s);
        this.createTile(index, face, faceCoords);
      } else {
        const faceCoords = new Vector2(s, 0.0);
        this.createTile(index, face, faceCoords);
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

    if (j < 0) return this.getEdgeTile(face.ab, i + 1);
    if (i === maxIJ) return this.getEdgeTile(face.cb, maxIJ - j);
    if (j === i)
      return this.getEdgeTile(face.ca, face.isPolar ? j + 1 : maxIJ - j);

    // Default case
    return this.getFaceTile(face, i, j);
  };

  private readonly populateFace = (face: IcosphereFace) => {
    for (let i = 0; i < (this.resolution + 1) * chunkSize - 1; i++) {
      for (let j = 0; j < i; j++) {
        const index = this.getFaceTileIndex(face.index, i, j);
        const s = (i + 1.0) / ((this.resolution + 1) * chunkSize);
        const t = (j + 1.0) / ((this.resolution + 1) * chunkSize);
        this.createTile(index, face, new Vector2(s, t));
      }
    }
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
