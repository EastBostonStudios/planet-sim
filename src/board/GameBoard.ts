import { getTriangleNumber } from "../utils/mathUtils";

import * as Icosahedron from "./Icosahedron";

const chunkSize = 8;

export enum GameBoardTileShape {
  //
  CornerPentagon = 0,
  EdgeHexagon = 1,
  FaceHexagon = 2,
  //
  Swap1PentagonA = 3,
  Swap1PentagonB = 4,
  Swap1HeptagonA = 5,
  Swap1HeptagonB = 6,
  //,
  Swap2PentagonA = 7,
  Swap2PentagonB = 8,
  Swap2HeptagonA = 9,
  Swap2HeptagonB = 10,
  //,
  Swap3PentagonA = 11,
  Swap3PentagonB = 12,
  Swap3HeptagonA = 13,
  Swap3HeptagonB = 14,
}

export type GameBoardCoords = {
  face: Icosahedron.Face;
  x: number;
  y: number;
};

export type GameBoardTile = {
  readonly index: number;
  readonly coords: GameBoardCoords;
  readonly neighbors: GameBoardTile[];
  readonly shape?: GameBoardTileShape | undefined;
};

export type GameBoardTriangle = {
  readonly index: number;
  readonly face: Icosahedron.Face;
  readonly a: GameBoardTile;
  readonly b: GameBoardTile;
  readonly c: GameBoardTile;
};

export type GameBoardChunk = {
  readonly index: number;
  readonly face: Icosahedron.Face;
  readonly triangles: GameBoardTriangle[];
};

//------------------------------------------------------------------------------

export class GameBoard {
  //----------------------------------------------------------------------------

  public readonly tiles: GameBoardTile[];
  public readonly triangles: GameBoardTriangle[];
  public readonly chunks: GameBoardChunk[];

  // The maximum "i" or "j" value on a face is the edge length minus 1
  private readonly maxIJ: number;
  private readonly widthInChunks: number;
  private readonly doSwaps: boolean;

  //----------------------------------------------------------------------------

  public constructor(resolution: number, doSwaps?: boolean) {
    this.maxIJ = (resolution + 1) * chunkSize - 1;
    this.widthInChunks = resolution + 1;
    this.doSwaps = doSwaps ?? true;

    // Initialize variables and pre-allocate space for the arrays  -------------

    const { faces, edges } = Icosahedron;
    this.tiles = new Array<GameBoardTile>(
      this.getFaceTileIndex(faces.length, 0, 0),
    );
    this.triangles = new Array<GameBoardTriangle>(
      faces.length *
        ((resolution + 1) * (resolution + 1) * chunkSize * chunkSize),
    );
    this.chunks = new Array<GameBoardChunk>(
      faces.length * (resolution + 1) * (resolution + 1),
    );

    // Create all icosahedron corner tiles -------------------------------------

    this.createTile(0, faces[0], 0.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(1, faces[0], 1.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(2, faces[1], 1.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(3, faces[2], 1.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(4, faces[3], 1.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(5, faces[4], 1.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(6, faces[6], 0.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(7, faces[8], 0.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(8, faces[10], 0.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(9, faces[12], 0.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(10, faces[14], 0.0, 0.0, GameBoardTileShape.CornerPentagon);
    this.createTile(11, faces[19], 0.0, 0.0, GameBoardTileShape.CornerPentagon);

    // Create all icosahedron edge tiles and stitch them together --------------

    // Diagonal edges starting at p0
    this.populateEdge(edges[0], faces[0]);
    this.populateEdge(edges[1], faces[1]);
    this.populateEdge(edges[2], faces[2]);
    this.populateEdge(edges[3], faces[3]);
    this.populateEdge(edges[4], faces[4]);

    // First horizontal edge row
    this.populateEdge(edges[5], faces[5]);
    this.populateEdge(edges[6], faces[7]);
    this.populateEdge(edges[7], faces[9]);
    this.populateEdge(edges[8], faces[11]);
    this.populateEdge(edges[9], faces[13]);

    // Diagonal edges
    this.populateEdge(edges[10], faces[5]);
    this.populateEdge(edges[11], faces[6]);
    this.populateEdge(edges[12], faces[7]);
    this.populateEdge(edges[13], faces[8]);
    this.populateEdge(edges[14], faces[9]);
    this.populateEdge(edges[15], faces[10]);
    this.populateEdge(edges[16], faces[11]);
    this.populateEdge(edges[17], faces[12]);
    this.populateEdge(edges[18], faces[13]);
    this.populateEdge(edges[19], faces[14]);

    // Second horizontal edge row
    this.populateEdge(edges[20], faces[6]);
    this.populateEdge(edges[21], faces[8]);
    this.populateEdge(edges[22], faces[10]);
    this.populateEdge(edges[23], faces[12]);
    this.populateEdge(edges[24], faces[14]);

    // Diagonal edges ending at p11
    this.populateEdge(edges[25], faces[15]);
    this.populateEdge(edges[26], faces[16]);
    this.populateEdge(edges[27], faces[17]);
    this.populateEdge(edges[28], faces[18]);
    this.populateEdge(edges[29], faces[19]);

    // Add neighbors to the 12 icosahedron point tiles -------------------------
    const em = this.widthInChunks * chunkSize - 2; // "edge max"

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

    // Create tiles, chunks, and triangles for each face
    for (let f = 0; f < faces.length; f++) this.populateFace(faces[f]);

    this.validate();
  }

  //----------------------------------------------------------------------------

  private readonly getEdgeTileIndex = (edgeIndex: number, i: number) => {
    if (i < 0 || i > this.maxIJ) throw new Error(`${i} out of bounds!`);
    return 12 + edgeIndex * (this.widthInChunks * chunkSize - 1) + i;
  };

  private readonly getFaceTileIndex = (
    faceIndex: number,
    i: number,
    j: number,
  ) => {
    if (i < 0 || i > this.maxIJ) throw new Error(`(${i}, ${j}) out of bounds!`);
    if (j < 0 || j > i || j > this.maxIJ)
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
    return this.tiles[this.getFaceTileIndex(face.index, i, j)];
  };

  //----------------------------------------------------------------------------

  private readonly createTile = (
    index: number,
    face: Icosahedron.Face,
    x: number,
    y: number,
    shape: GameBoardTileShape,
  ) => {
    const neighborCount =
      shape === GameBoardTileShape.FaceHexagon ||
      shape === GameBoardTileShape.EdgeHexagon
        ? 6
        : shape === GameBoardTileShape.CornerPentagon ||
            shape === GameBoardTileShape.Swap1PentagonA ||
            shape === GameBoardTileShape.Swap1PentagonB ||
            shape === GameBoardTileShape.Swap2PentagonA ||
            shape === GameBoardTileShape.Swap2PentagonB ||
            shape === GameBoardTileShape.Swap3PentagonA ||
            shape === GameBoardTileShape.Swap3PentagonB
          ? 5
          : 7;
    this.tiles[index] = {
      index,
      coords: { face, x, y },
      neighbors: new Array(neighborCount),
      shape,
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
    this.triangles[index] = { index, face, a, b, c };
    return this.triangles[index];
  };

  private readonly populateEdge = (
    edge: Icosahedron.Edge,
    face: Icosahedron.Face,
  ) => {
    const shape = GameBoardTileShape.EdgeHexagon;
    for (let i = 0; i < this.maxIJ; i++) {
      const index = this.getEdgeTileIndex(edge.index, i);
      const s = (i + 1.0) / (this.widthInChunks * chunkSize);
      if (edge.index > 24) {
        const tile = this.createTile(index, face, s, s, shape);
        this.stitchEdgeTiles(i, tile, face.a, face.c);
      } else if (
        edge.index > 4 &&
        edge.index < 20 &&
        (edge.index < 10 || edge.index % 2 === 1)
      ) {
        const tile = this.createTile(index, face, 1.0 - s, 1.0 - s, shape);
        this.stitchEdgeTiles(i, tile, face.c, face.a);
      } else {
        const tile = this.createTile(index, face, s, 0.0, shape);
        this.stitchEdgeTiles(i, tile, face.a, face.b);
      }
    }
  };

  private readonly stitchEdgeTiles = (
    i: number,
    tile: GameBoardTile,
    start: Icosahedron.Point,
    end: Icosahedron.Point,
  ) => {
    if (i === 0) {
      tile.neighbors[3] = this.tiles[start.index];
    } else {
      tile.neighbors[3] = this.tiles[tile.index - 1];
      this.tiles[tile.index - 1].neighbors[0] = tile;
      if (i === this.maxIJ - 1) {
        tile.neighbors[0] = this.tiles[end.index];
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly getShapeForChunkCoords = (ci: number, cj: number) => {
    if (!this.doSwaps) return GameBoardTileShape.FaceHexagon;

    // Swap 1 (bottom-left)
    if ((ci === 2 && cj === 1) || (ci === 4 && cj === 6))
      return GameBoardTileShape.Swap1PentagonA;
    if ((ci === 2 && cj === 0) || (ci === 4 && cj === 5))
      return GameBoardTileShape.Swap1PentagonB;
    if ((ci === 1 && cj === 0) || (ci === 3 && cj === 5))
      return GameBoardTileShape.Swap1HeptagonA;
    if ((ci === 3 && cj === 1) || (ci === 5 && cj === 6))
      return GameBoardTileShape.Swap1HeptagonB;

    // Swap 2 (bottom-left)
    if ((ci === 5 && cj === 0) || (ci === 1 && cj === 6))
      return GameBoardTileShape.Swap2PentagonA;
    if ((ci === 6 && cj === 1) || (ci === 0 && cj === 5))
      return GameBoardTileShape.Swap2PentagonB;
    if ((ci === 5 && cj === 1) || (ci === 0 && cj === 6))
      return GameBoardTileShape.Swap2HeptagonA;
    if ((ci === 6 && cj === 0) || (ci === 1 && cj === 5))
      return GameBoardTileShape.Swap2HeptagonB;

    // Swap 3 (bottom-left)
    if ((ci === 6 && cj === 4) || (ci === 6 - 5 && cj === 4 - 2))
      return GameBoardTileShape.Swap3PentagonA;
    if ((ci === 5 && cj === 4) || (ci === 5 - 5 && cj === 4 - 2))
      return GameBoardTileShape.Swap3PentagonB;
    if ((ci === 6 && cj === 5) || (ci === 6 - 5 && cj === 5 - 2))
      return GameBoardTileShape.Swap3HeptagonA;
    if ((ci === 5 && cj === 3) || (ci === 5 - 5 && cj === 3 - 2))
      return GameBoardTileShape.Swap3HeptagonB;

    return GameBoardTileShape.FaceHexagon;
  };

  private readonly getFlippedTriangleDistortion = (ci: number, cj: number) => {
    // Bottom-left distortion
    if ((ci === 3 && cj === 1) || (ci === 5 && cj === 6)) return 1;
    // Bottom-right distortion
    if ((ci === 6 && cj === 1) || (ci === 1 && cj === 6)) return 2;
    // Top distortion
    if ((ci === 6 && cj === 4) || (ci === 1 && cj === 2)) return 3;
    return 0;
  };

  private readonly getUprightTriangleDistortion = (ci: number, cj: number) => {
    // Bottom-left distortion
    if ((ci === 2 && cj === 1) || (ci === 4 && cj === 6)) return 1;
    // Bottom-right distortion
    if ((ci === 6 && cj === 1) || (ci === 1 && cj === 6)) return 2;
    // Top distortion
    if ((ci === 6 && cj === 5) || (ci === 1 && cj === 3)) return 3;
    return 0;
  };

  private readonly populateFace = (face: Icosahedron.Face) => {
    // Create all tiles for this face ------------------------------------------

    for (let i = 0; i < this.maxIJ; i++) {
      for (let j = 0; j < i; j++) {
        const index = this.getFaceTileIndex(face.index, i, j);
        const s = (i + 1.0) / (this.widthInChunks * chunkSize);
        const t = (j + 1.0) / (this.widthInChunks * chunkSize);
        const ci = i % chunkSize;
        const cj = j % chunkSize;
        this.createTile(index, face, s, t, this.getShapeForChunkCoords(ci, cj));
      }
    }

    // Create all chunks for this face -----------------------------------------

    const chunksPerFace = this.widthInChunks * this.widthInChunks;
    for (let c = 0; c < chunksPerFace; c++) {
      const index = face.index * chunksPerFace + c;
      const triangles = new Array(chunkSize * chunkSize);
      this.chunks[index] = { index, face, triangles };
    }

    // Create all triangles for this face --------------------------------------

    let index = face.index * (chunksPerFace * chunkSize * chunkSize);
    for (let i = 0; i < this.maxIJ + 1; i++) {
      const chunkI = Math.trunc(i / chunkSize);
      const ci = i % chunkSize;

      for (let j = 0; j <= i; j++) {
        const chunkJ = Math.trunc(j / chunkSize);
        const cj = j % chunkSize;
        const chunkIndex =
          face.index * chunksPerFace + chunkI * chunkI + chunkJ * 2;

        if (j < i) {
          const a = this.getFaceTile(face, i, j);
          let b = this.getFaceTile(face, i - 1, j);
          let c = this.getFaceTile(face, i - 1, j - 1);

          const distortion = this.getFlippedTriangleDistortion(ci, cj);
          if (distortion === 1) c = this.getFaceTile(face, i - 2, j - 1);
          else if (distortion === 2) c = this.getFaceTile(face, i, j - 1);
          else if (distortion === 3) b = this.getFaceTile(face, i, j + 1);

          const t = this.createTri(index, face, a, b, c);
          const chunk = this.chunks[chunkIndex + (cj < ci ? 0 : 1)];
          chunk.triangles[cj < ci ? ci * ci + cj * 2 + 1 : cj * cj + ci * 2] =
            t;
          index++;
        }

        let a = this.getFaceTile(face, i, j);
        const b = this.getFaceTile(face, i - 1, j - 1);
        let c = this.getFaceTile(face, i, j - 1);

        // Bottom-left distortion
        const distortion = this.getUprightTriangleDistortion(ci, cj);
        if (distortion === 1) a = this.getFaceTile(face, i + 1, j);
        else if (distortion === 2) a = this.getFaceTile(face, i - 1, j);
        else if (distortion === 3) c = this.getFaceTile(face, i - 1, j - 2);

        const t = this.createTri(index, face, a, b, c);
        const chunk = this.chunks[chunkIndex + (cj > ci ? 1 : 0)];
        chunk.triangles[cj > ci ? cj * cj + ci * 2 + 1 : ci * ci + cj * 2] = t;
        index++;
      }
    }

    // Stitch edges to this face's points --------------------------------------

    // A -> B Edge
    for (let i = 0; i < this.maxIJ; i++) {
      const edgeTile = this.getFaceTile(face, i, -1);
      const n0 = this.getFaceTile(face, i + 1, 0);
      const n1 = this.getFaceTile(face, i, 0);
      if (face.index < 5 || face.index >= 15 || face.index % 2 === 1) {
        edgeTile.neighbors[1] = n0;
        edgeTile.neighbors[2] = n1;
      } else {
        edgeTile.neighbors[5] = n0;
        edgeTile.neighbors[4] = n1;
      }
    }

    // B -> C Edge
    for (let i = 0; i < this.maxIJ; i++) {
      const edgeTile = this.getFaceTile(face, this.maxIJ, i);
      const n0 = this.getFaceTile(face, this.maxIJ - 1, i);
      const n1 = this.getFaceTile(face, this.maxIJ - 1, i - 1);
      if (face.index < 5) {
        edgeTile.neighbors[4] = n0;
        edgeTile.neighbors[5] = n1;
      } else if (face.index >= 15 || face.index % 2 === 1) {
        edgeTile.neighbors[2] = n0;
        edgeTile.neighbors[1] = n1;
      } else {
        edgeTile.neighbors[4] = n0;
        edgeTile.neighbors[5] = n1;
      }
    }

    // C -> A Edge
    for (let i = 0; i < this.maxIJ; i++) {
      const edgeTile = this.getFaceTile(face, i, i);
      const n0 = this.getFaceTile(face, i + 1, i);
      const n1 = this.getFaceTile(face, i, i - 1);
      if (face.index < 5 || face.index >= 15) {
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

    // Stitch together the rest of this face's points --------------------------

    for (let i = 0; i < this.maxIJ; i++) {
      for (let j = 0; j < i; j++) {
        const tile = this.getFaceTile(face, i, j);
        switch (tile.shape) {
          case GameBoardTileShape.Swap1PentagonA:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[4] = this.getFaceTile(face, i - 1, j - 1);
            break;
          case GameBoardTileShape.Swap1PentagonB:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[4] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap1HeptagonA:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 2, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[4] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[5] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[6] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap1HeptagonB:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[4] = this.getFaceTile(face, i - 2, j - 1);
            tile.neighbors[5] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[6] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap2PentagonA:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[4] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap2PentagonB:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[4] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap2HeptagonA:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[4] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[5] = this.getFaceTile(face, i, j - 1);
            tile.neighbors[6] = this.getFaceTile(face, i + 1, j - 1);
            break;
          case GameBoardTileShape.Swap2HeptagonB:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j + 1);
            tile.neighbors[4] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[5] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[6] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap3PentagonA:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[4] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap3PentagonB:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[1] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[4] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap3HeptagonA:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[4] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[5] = this.getFaceTile(face, i - 1, j - 2);
            tile.neighbors[6] = this.getFaceTile(face, i, j - 1);
            break;
          case GameBoardTileShape.Swap3HeptagonB:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i + 1, j + 2);
            tile.neighbors[3] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[4] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[5] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[6] = this.getFaceTile(face, i, j - 1);
            break;
          default:
            tile.neighbors[0] = this.getFaceTile(face, i + 1, j);
            tile.neighbors[1] = this.getFaceTile(face, i + 1, j + 1);
            tile.neighbors[2] = this.getFaceTile(face, i, j + 1);
            tile.neighbors[3] = this.getFaceTile(face, i - 1, j);
            tile.neighbors[4] = this.getFaceTile(face, i - 1, j - 1);
            tile.neighbors[5] = this.getFaceTile(face, i, j - 1);
            break;
        }
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly validate = () => {
    for (let i = 0; i < this.tiles?.length; i++) {
      console.assert(this.tiles[i]?.index === i, "Tile indices incorrect!");
      for (let j = 0; j < this.tiles[i]?.neighbors.length; j++) {
        console.assert(
          !!this.tiles[i]?.neighbors[j],
          "Tiles missing neighbors!",
        );
      }
    }
    for (let i = 0; i < this.triangles.length; i++) {
      console.assert(this.triangles[i]?.index === i, "Tri indices incorrect!");
    }
    for (let i = 0; i < this.chunks.length; i++) {
      console.assert(this.chunks[i].index === i, "Chunk indices incorrect!");
      for (let j = 0; j < this.chunks[i].triangles.length; j++) {
        console.assert(
          !!this.chunks[i].triangles[j],
          "Chunk missing triangles!",
        );
      }
    }
  };
}
