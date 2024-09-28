import { Vector2 } from "three";
import {
  type IcosphereEdge,
  type IcosphereFace,
  icosahedron,
} from "../icosphere/Icosahedron";
import { getTriangleNumber } from "../icosphere/utils";

const chunkSize = 3;

export type GameBoardTile = {
  readonly index: number;
  readonly face: IcosphereFace;
  readonly neighbors: (GameBoardTile | null)[];
  readonly faceCoords: Vector2;
};

export type GameBoardConnection = {
  readonly index: number;
  readonly start: GameBoardTile;
  readonly end: GameBoardTile;
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
    const { faces, edges } = icosahedron;

    // Initialize variables and pre-allocate space for the arrays
    this.resolution = resolution;
    this.tiles = new Array<GameBoardTile>(
      this.getFaceTileIndex(faces.length, 0, 0),
    );
    this.tris = new Array<GameBoardTri>(
      faces.length *
        ((resolution + 1) * (resolution + 1) * chunkSize * chunkSize),
    );
    this.chunks = new Array<GameBoardChunk>(
      faces.length * (resolution + 1) * (resolution + 1),
    );
    // TODO: Preallocate these arrays
    this.connections = new Array<GameBoardConnection>();

    // Pentagonal tiles at the twelve icosahedron points
    this.createTile(0, faces[0], new Vector2(0.0, 0.0));
    this.createTile(1, faces[0], new Vector2(1.0, 0.0));
    this.createTile(2, faces[1], new Vector2(1.0, 0.0));
    this.createTile(3, faces[2], new Vector2(1.0, 0.0));
    this.createTile(4, faces[3], new Vector2(1.0, 0.0));
    this.createTile(5, faces[4], new Vector2(1.0, 0.0));
    this.createTile(6, faces[6], new Vector2(0.0, 0.0));
    this.createTile(7, faces[8], new Vector2(0.0, 0.0));
    this.createTile(8, faces[10], new Vector2(0.0, 0.0));
    this.createTile(9, faces[12], new Vector2(0.0, 0.0));
    this.createTile(10, faces[14], new Vector2(0.0, 0.0));
    this.createTile(11, faces[19], new Vector2(0.0, 0.0));

    // Diagonal edges starting at p0
    this.createEdgeTiles(edges[0], faces[0]);
    this.createEdgeTiles(edges[1], faces[1]);
    this.createEdgeTiles(edges[2], faces[2]);
    this.createEdgeTiles(edges[3], faces[3]);
    this.createEdgeTiles(edges[4], faces[4]);

    // First horizontal edge row
    this.createEdgeTiles(edges[5], faces[5]);
    this.createEdgeTiles(edges[6], faces[7]);
    this.createEdgeTiles(edges[7], faces[9]);
    this.createEdgeTiles(edges[8], faces[11]);
    this.createEdgeTiles(edges[9], faces[13]);

    // Diagonal edges
    this.createEdgeTiles(edges[10], faces[5]);
    this.createEdgeTiles(edges[11], faces[6]);
    this.createEdgeTiles(edges[12], faces[7]);
    this.createEdgeTiles(edges[13], faces[8]);
    this.createEdgeTiles(edges[14], faces[9]);
    this.createEdgeTiles(edges[15], faces[10]);
    this.createEdgeTiles(edges[16], faces[11]);
    this.createEdgeTiles(edges[17], faces[12]);
    this.createEdgeTiles(edges[18], faces[13]);
    this.createEdgeTiles(edges[19], faces[14]);

    // Second horizontal edge row
    this.createEdgeTiles(edges[20], faces[6]);
    this.createEdgeTiles(edges[21], faces[8]);
    this.createEdgeTiles(edges[22], faces[10]);
    this.createEdgeTiles(edges[23], faces[12]);
    this.createEdgeTiles(edges[24], faces[14]);

    // Diagonal edges ending at p11
    this.createEdgeTiles(edges[25], faces[15]);
    this.createEdgeTiles(edges[26], faces[16]);
    this.createEdgeTiles(edges[27], faces[17]);
    this.createEdgeTiles(edges[28], faces[18]);
    this.createEdgeTiles(edges[29], faces[19]);

    // Add neighbors to the 12 icosahedron point tiles
    const em = (this.resolution + 1) * chunkSize - 2; // "edge max"

    this.tiles[0].neighbors[0] = this.getEdgeTile(edges[0], 0);
    this.tiles[0].neighbors[1] = this.getEdgeTile(edges[1], 0);
    this.tiles[0].neighbors[2] = this.getEdgeTile(edges[2], 0);
    this.tiles[0].neighbors[3] = this.getEdgeTile(edges[3], 0);
    this.tiles[0].neighbors[4] = this.getEdgeTile(edges[4], 0);

    for (let i = 0; i < 5; i++) {
      const neighbors = this.tiles[i + 1].neighbors;
      neighbors[0] = this.getEdgeTile(edges[i + 5], em);
      neighbors[1] = this.getEdgeTile(edges[i], em);
      neighbors[2] = this.getEdgeTile(edges[i === 1 ? 9 : 4 + i], 0);
      neighbors[3] = this.getEdgeTile(edges[i === 1 ? 19 : 9 + i * 2], 0);
      neighbors[4] = this.getEdgeTile(edges[9 + i * 2 + 1], 0);
    }

    for (let i = 0; i < 5; i++) {
      const neighbors = this.tiles[i + 6].neighbors;
      neighbors[0] = this.getEdgeTile(edges[20 + i], 0);
      neighbors[1] = this.getEdgeTile(edges[10 + i * 2 + 1], em);
      neighbors[2] = this.getEdgeTile(edges[10 + i * 2], em);
      neighbors[3] = this.getEdgeTile(edges[i === 0 ? 24 : 20 + i - 1], em);
      neighbors[4] = this.getEdgeTile(edges[25 + i], em);
    }

    this.tiles[11].neighbors[0] = this.getEdgeTile(edges[29], 0);
    this.tiles[11].neighbors[1] = this.getEdgeTile(edges[28], 0);
    this.tiles[11].neighbors[2] = this.getEdgeTile(edges[27], 0);
    this.tiles[11].neighbors[3] = this.getEdgeTile(edges[26], 0);
    this.tiles[11].neighbors[4] = this.getEdgeTile(edges[25], 0);

    // console.log(this.tiles[3].neighbors.map((a) => a?.index));

    // Create face tiles, chunks, and tris
    for (let f = 0; f < faces.length; f++) {
      this.populateFace(faces[f]);
    }

    this.validate();
  }

  //----------------------------------------------------------------------------

  private readonly getEdgeTileIndex = (edgeIndex: number, i: number) => {
    if (i < 0 || i >= (this.resolution + 1) * chunkSize)
      throw new Error(`${i} out of bounds!`);
    return 12 + edgeIndex * ((this.resolution + 1) * chunkSize - 1) + i;
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

  private readonly getTile = (
    face: IcosphereFace,
    i: number,
    j: number,
  ): GameBoardTile => {
    // The maximum "i" or "j" value on a face is the edge length minus 1
    const maxIJ = (this.resolution + 1) * chunkSize - 1;

    // Corners
    if (i === -1 && j === -1) return this.tiles[face.a.index];
    if (i === maxIJ && j === -1) return this.tiles[face.b.index];
    if (i === maxIJ && j === maxIJ) return this.tiles[face.c.index];

    if (j < 0) return this.getEdgeTile(face.ab, i);
    if (i === maxIJ) return this.getEdgeTile(face.cb, maxIJ - j - 1);
    if (j === i)
      return this.getEdgeTile(face.ca, face.isPolar ? j : maxIJ - j - 1);

    // Default case
    return this.getFaceTile(face, i, j);
  };

  //----------------------------------------------------------------------------

  private readonly createTile = (
    index: number,
    face: IcosphereFace,
    faceCoords: Vector2,
  ) => {
    this.tiles[index] = {
      index,
      neighbors: [null, null, null, null, null, null],
      face,
      faceCoords,
    };
  };

  private readonly createEdgeTiles = (
    edge: IcosphereEdge,
    face: IcosphereFace,
  ) => {
    for (let i = 0; i < (this.resolution + 1) * chunkSize - 1; i++) {
      const index = this.getEdgeTileIndex(edge.index, i);
      const s = (i + 1.0) / ((this.resolution + 1) * chunkSize);
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

  private readonly populateFace = (face: IcosphereFace) => {
    const edgeLength = (this.resolution + 1) * chunkSize;

    for (let i = 0; i < edgeLength - 1; i++) {
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

    for (let i = 0; i < edgeLength; i++) {
      const chunkI = Math.trunc(i / chunkSize);
      const iOnChunk = i % chunkSize;

      for (let j = 0; j <= i; j++) {
        const chunkJ = Math.trunc(j / chunkSize);
        const jOnChunk = j % chunkSize;

        const chunkIndex =
          face.index * chunksPerFace + chunkI * chunkI + chunkJ * 2;

        const tile = this.getTile(face, i, j);

        if (j < i) {
          // -1 represents off of the face tiles (connecting to the edge tiles)
          const a = tile;
          const b = this.getTile(face, i - 1, j);
          const c = this.getTile(face, i - 1, j - 1);
          const tri = { index, face, a, b, c };
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

        const a = this.getTile(face, i - 1, j - 1);
        const b = this.getTile(face, i, j - 1);
        const c = tile;
        const tri = { index, face, a, b, c };
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

    /*
    for (let i = 0; i < edgeLength - 1; i++) {
      const tile = this.getTile(face, i, 0);
      tile.neighbors[0] = this.getTile(face, i, -1);
      tile.neighbors[1] = this.getTile(face, i + 1, 0);
      tile.neighbors[2] = this.getTile(face, i + 1, 1);
    }*/

    for (let i = 0; i < edgeLength - 1; i++) {
      for (let j = 0; j < i; j++) {
        const tile = this.getTile(face, i, j);
        tile.neighbors[0] = this.getTile(face, i + 1, j);
        tile.neighbors[1] = this.getTile(face, i + 1, j + 1);
        tile.neighbors[2] = this.getTile(face, i, j + 1);
        tile.neighbors[3] = this.getTile(face, i - 1, j);
        tile.neighbors[4] = this.getTile(face, i - 1, j - 1);
        tile.neighbors[5] = this.getTile(face, i, j - 1);
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly validate = () => {
    for (let i = 0; i < this.tiles.length; i++) {
      console.assert(this.tiles[i].index === i, "Tile indices incorrect!");
    }
    for (let i = 0; i < this.tris.length; i++) {
      console.assert(this.tris[i].index === i, "Tri indices incorrect!");
    }
    for (let i = 0; i < this.chunks.length; i++) {
      console.assert(this.chunks[i].index === i, "Chunk indices incorrect!");
      for (let j = 0; j < this.chunks[i].tris.length; j++) {
        console.assert(!!this.chunks[i].tris[j], "Chunk missing tris!");
      }
    }
  };
}
