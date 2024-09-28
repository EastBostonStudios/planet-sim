import { Vector2 } from "three";
import { getTriangleNumber } from "../utils/mathUtils";

import * as Icosahedron from "./Icosahedron";

const chunkSize = 3;

export type GameBoardTile = {
  readonly index: number;
  readonly face: Icosahedron.Face;
  readonly neighbors: (GameBoardTile | null)[];
  readonly faceCoords: Vector2;
};

export type GameBoardTri = {
  readonly index: number;
  readonly face: Icosahedron.Face;
  readonly a: GameBoardTile;
  readonly b: GameBoardTile;
  readonly c: GameBoardTile;
};

export type GameBoardChunk = {
  readonly index: number;
  readonly face: Icosahedron.Face;
  readonly tris: GameBoardTri[];
};

//------------------------------------------------------------------------------

export class GameBoard {
  //----------------------------------------------------------------------------

  public readonly resolution: number;
  public readonly tiles: GameBoardTile[];
  public readonly tris: GameBoardTri[];
  public readonly chunks: GameBoardChunk[];

  // The maximum "i" or "j" value on a face is the edge length minus 1
  private readonly maxIJ: number;

  //----------------------------------------------------------------------------

  public constructor(resolution: number) {
    const { faces, edges } = Icosahedron;

    this.maxIJ = (resolution + 1) * chunkSize - 1;

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

    // Add neighbors to the 12 icosahedron point tiles -------------------------
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
      neighbors[2] = this.getEdgeTile(edges[i === 0 ? 9 : 4 + i], 0);
      neighbors[3] = this.getEdgeTile(edges[i === 0 ? 19 : 9 + i * 2], 0);
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

    // Create face tiles, chunks, and tris
    for (let f = 0; f < faces.length; f++) {
      this.populateFace(faces[f]);
    }

    this.validate();
  }

  //----------------------------------------------------------------------------

  private readonly getEdgeTileIndex = (edgeIndex: number, i: number) => {
    if (i < 0 || i > this.maxIJ) throw new Error(`${i} out of bounds!`);
    return 12 + edgeIndex * ((this.resolution + 1) * chunkSize - 1) + i;
  };

  private readonly getFaceTileIndex = (
    faceIndex: number,
    i: number,
    j: number,
  ) => {
    if (i < 0 || i >= this.maxIJ)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    if (j < 0 || j > i || j >= this.maxIJ)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    return (
      12 +
      30 * this.maxIJ +
      faceIndex * getTriangleNumber(this.maxIJ - 1) +
      getTriangleNumber(i - 1) +
      j
    );
  };

  private readonly getEdgeTile = (edge: Icosahedron.Edge, i: number) =>
    this.tiles[this.getEdgeTileIndex(edge.index, i)];

  private readonly getFaceTile = (
    face: Icosahedron.Face,
    i: number,
    j: number,
  ) => this.tiles[this.getFaceTileIndex(face.index, i, j)];

  private readonly getTile = (
    face: Icosahedron.Face,
    i: number,
    j: number,
  ): GameBoardTile => {
    // Corners
    if (i === -1 && j === -1) return this.tiles[face.a.index];
    if (i === this.maxIJ && j === -1) return this.tiles[face.b.index];
    if (i === this.maxIJ && j === this.maxIJ) return this.tiles[face.c.index];

    if (j < 0) return this.getEdgeTile(face.ab, i);
    if (i === this.maxIJ) return this.getEdgeTile(face.cb, this.maxIJ - j - 1);
    if (j === i)
      return this.getEdgeTile(
        face.ca,
        face.index < 5 || face.index >= 15 ? j : this.maxIJ - j - 1,
      );

    // Default case
    return this.getFaceTile(face, i, j);
  };

  //----------------------------------------------------------------------------

  private readonly createTile = (
    index: number,
    face: Icosahedron.Face,
    faceCoords: Vector2,
  ) => {
    this.tiles[index] = {
      index,
      neighbors: new Array(index < Icosahedron.points.length ? 5 : 6),
      face,
      faceCoords,
    };
    return this.tiles[index];
  };

  private readonly createTri = (
    index: number,
    face: Icosahedron.Face,
    a: GameBoardTile,
    b: GameBoardTile,
    c: GameBoardTile,
  ) => {
    this.tris[index] = { index, face, a, b, c };
    return this.tris[index];
  };

  private readonly stitchEdgeTiles = (
    i: number,
    tile: GameBoardTile,
    startPoint: Icosahedron.Point,
    endPoint: Icosahedron.Point,
  ) => {
    if (i === 0) {
      tile.neighbors[3] = this.tiles[startPoint.index];
    } else {
      tile.neighbors[3] = this.tiles[tile.index - 1];
      this.tiles[tile.index - 1].neighbors[0] = tile;
      if (i === this.maxIJ - 1) {
        tile.neighbors[0] = this.tiles[endPoint.index];
      }
    }
  };

  private readonly createEdgeTiles = (
    edge: Icosahedron.Edge,
    face: Icosahedron.Face,
  ) => {
    for (let i = 0; i < this.maxIJ; i++) {
      const index = this.getEdgeTileIndex(edge.index, i);
      const s = (i + 1.0) / ((this.resolution + 1) * chunkSize);
      if (edge.index > 24) {
        const faceCoords = new Vector2(s, s);
        const tile = this.createTile(index, face, faceCoords);
        this.stitchEdgeTiles(i, tile, face.a, face.c);
      } else if (
        edge.index > 4 &&
        edge.index < 20 &&
        (edge.index < 10 || edge.index % 2 === 1)
      ) {
        const faceCoords = new Vector2(1.0 - s, 1.0 - s);
        const tile = this.createTile(index, face, faceCoords);
        this.stitchEdgeTiles(i, tile, face.c, face.a);
      } else {
        const faceCoords = new Vector2(s, 0.0);
        const tile = this.createTile(index, face, faceCoords);
        this.stitchEdgeTiles(i, tile, face.a, face.b);
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly populateFace = (face: Icosahedron.Face) => {
    for (let i = 0; i < this.maxIJ; i++) {
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

    for (let i = 0; i <= this.maxIJ; i++) {
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
          const tri = this.createTri(
            index,
            face,
            tile,
            this.getTile(face, i - 1, j),
            this.getTile(face, i - 1, j - 1),
          );

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

        const tri = this.createTri(
          index,
          face,
          this.getTile(face, i - 1, j - 1),
          this.getTile(face, i, j - 1),
          tile,
        );

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

    // A->B
    for (let i = 0; i < this.maxIJ; i++) {
      const edgeTile = this.getTile(face, i, -1);
      const n0 = this.getTile(face, i + 1, 0);
      const n1 = this.getTile(face, i, 0);
      if (face.index < 5) {
        edgeTile.neighbors[1] = n0;
        edgeTile.neighbors[2] = n1;
      } else if (face.index >= 15) {
        edgeTile.neighbors[1] = n0;
        edgeTile.neighbors[2] = n1;
      } else if (face.index % 2 === 0) {
        edgeTile.neighbors[5] = n0;
        edgeTile.neighbors[4] = n1;
      } else {
        edgeTile.neighbors[1] = n0;
        edgeTile.neighbors[2] = n1;
      }
    }

    //B->C
    for (let i = 0; i < this.maxIJ; i++) {
      const edgeTile = this.getTile(face, this.maxIJ, i);
      const n0 = this.getTile(face, this.maxIJ - 1, i);
      const n1 = this.getTile(face, this.maxIJ - 1, i - 1);

      if (face.index < 5) {
        edgeTile.neighbors[4] = n0;
        edgeTile.neighbors[5] = n1;
      } else if (face.index >= 15) {
        edgeTile.neighbors[2] = n0;
        edgeTile.neighbors[1] = n1;
      } else if (face.index % 2 === 0) {
        edgeTile.neighbors[4] = n0;
        edgeTile.neighbors[5] = n1;
      } else {
        edgeTile.neighbors[2] = n0;
        edgeTile.neighbors[1] = n1;
      }
    }

    // C->A
    for (let i = 0; i < this.maxIJ; i++) {
      const edgeTile = this.getTile(face, i, i);
      const n0 = this.getTile(face, i + 1, i);
      const n1 = this.getTile(face, i, i - 1);
      if (face.index < 5) {
        edgeTile.neighbors[5] = n0;
        edgeTile.neighbors[4] = n1;
      } else if (face.index >= 15) {
        edgeTile.neighbors[5] = n0;
        edgeTile.neighbors[4] = n1;
      } else if (face.index % 2 === 0) {
        edgeTile.neighbors[4] = n0;
        edgeTile.neighbors[5] = n1;
      } else {
        edgeTile.neighbors[2] = n0;
        edgeTile.neighbors[1] = n1;
      }
    }

    for (let i = 0; i < this.maxIJ; i++) {
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
      for (let j = 0; j < this.tiles[i].neighbors.length; j++) {
        console.assert(
          !!this.tiles[i].neighbors[j],
          "Tiles missing neighbors!",
        );
      }
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
