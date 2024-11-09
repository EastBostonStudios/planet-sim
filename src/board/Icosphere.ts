import { type Vector2, Vector3 } from "three";
import * as Icosahedron from "./Icosahedron";
import { getTriangleNumber } from "./faceMath";
import { xyzToLatLng } from "./sphereMath";

const chunkSize = 8;

export enum IcoTileShape {
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

export type IcoCoords = {
  face: Icosahedron.Face;
  x: number;
  y: number;
};

export type IcoTile = {
  readonly index: number;
  readonly coords: IcoCoords;
  readonly neighbors: IcoTile[];
  readonly shape: IcoTileShape;
  readonly xyz: Vector3;
  readonly lngLat: Vector2;
};

export type IcoTriangle = {
  readonly index: number;
  readonly face: Icosahedron.Face;
  readonly a: IcoTile;
  readonly b: IcoTile;
  readonly c: IcoTile;
};

export type IcoChunk = {
  readonly index: number;
  readonly face: Icosahedron.Face;
  readonly triangles: IcoTriangle[];
};

//------------------------------------------------------------------------------

export class Icosphere {
  //----------------------------------------------------------------------------

  public readonly tiles: IcoTile[];
  public readonly triangles: IcoTriangle[];
  public readonly chunks: IcoChunk[];

  private readonly widthInTiles: number;
  private readonly widthInChunks: number;
  private readonly doSwaps: boolean;

  //----------------------------------------------------------------------------

  public constructor(size: number, doSwaps?: boolean) {
    this.widthInTiles = (size + 1) * chunkSize;
    this.widthInChunks = size + 1;
    this.doSwaps = doSwaps ?? true;

    // Initialize variables and pre-allocate space for the arrays  -------------

    const { faces, edges } = Icosahedron;
    this.tiles = new Array<IcoTile>(this.getFaceTileIndex(faces.length, 0, 0));
    this.triangles = new Array<IcoTriangle>(
      faces.length * this.widthInTiles * this.widthInTiles,
    );
    this.chunks = new Array<IcoChunk>(
      faces.length * this.widthInChunks * this.widthInChunks,
    );

    // Create all icosahedron corner tiles -------------------------------------

    this.createTile(0, faces[0], 0.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(1, faces[0], 1.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(2, faces[1], 1.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(3, faces[2], 1.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(4, faces[3], 1.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(5, faces[4], 1.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(6, faces[6], 0.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(7, faces[8], 0.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(8, faces[10], 0.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(9, faces[12], 0.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(10, faces[14], 0.0, 0.0, IcoTileShape.CornerPentagon);
    this.createTile(11, faces[19], 0.0, 0.0, IcoTileShape.CornerPentagon);

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

    this.tiles[0].neighbors[0] = this.getEdgeTile(edges[0], 0);
    this.tiles[0].neighbors[1] = this.getEdgeTile(edges[1], 0);
    this.tiles[0].neighbors[2] = this.getEdgeTile(edges[2], 0);
    this.tiles[0].neighbors[3] = this.getEdgeTile(edges[3], 0);
    this.tiles[0].neighbors[4] = this.getEdgeTile(edges[4], 0);

    const em = this.widthInTiles - 2; // "edge max"
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
  }

  //----------------------------------------------------------------------------

  private readonly getEdgeTileIndex = (edgeIndex: number, i: number) => {
    if (i < 0 || i > this.widthInTiles - 1)
      throw new Error(`${i} out of bounds!`);
    return 12 + edgeIndex * (this.widthInTiles - 1) + i;
  };

  private readonly getFaceTileIndex = (
    faceIndex: number,
    i: number,
    j: number,
  ) => {
    if (i < 0 || i > this.widthInTiles - 1)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    if (j < 0 || j > i || j > this.widthInTiles - 1)
      throw new Error(`(${i}, ${j}) out of bounds!`);
    return (
      12 +
      30 * (this.widthInTiles - 1) +
      faceIndex * getTriangleNumber(this.widthInTiles - 1 - 1) +
      getTriangleNumber(i - 1) +
      j
    );
  };

  private readonly getEdgeTile = (edge: Icosahedron.Edge, i: number) =>
    this.tiles[this.getEdgeTileIndex(edge.index, i)];

  // This method's name is super short to make other code concise
  private readonly find = (
    face: Icosahedron.Face,
    i: number,
    j: number,
  ): IcoTile => {
    // Corners
    if (i === -1 && j === -1) return this.tiles[face.a.index];
    if (i === this.widthInTiles - 1 && j === -1)
      return this.tiles[face.b.index];
    if (i === this.widthInTiles - 1 && j === this.widthInTiles - 1)
      return this.tiles[face.c.index];

    if (j < 0) return this.getEdgeTile(face.ab, i);
    if (i === this.widthInTiles - 1)
      return this.getEdgeTile(face.cb, this.widthInTiles - j - 2);
    if (j === i)
      return this.getEdgeTile(
        face.ca,
        face.index < 5 || face.index >= 15 ? j : this.widthInTiles - j - 2,
      );

    // Default case
    return this.tiles[this.getFaceTileIndex(face.index, i, j)];
  };

  //----------------------------------------------------------------------------

  private readonly interpolateOnFace = (
    a: Vector3,
    b: Vector3,
    c: Vector3,
    x: number,
    y: number,
  ): Vector3 => {
    if (x < 0 || x > 1 || y < 0 || y > 1 || y > x)
      throw new Error(`(${x}, ${y}) out of bounds!`);
    if (x === 0) return a;
    const ab = new Vector3().lerpVectors(a, b, x);
    const ca = new Vector3().lerpVectors(a, c, x);
    return new Vector3().lerpVectors(ab, ca, y / x);
  };

  private readonly createTile = (
    index: number,
    face: Icosahedron.Face,
    x: number,
    y: number,
    shape: IcoTileShape,
  ) => {
    const neighborCount =
      shape === IcoTileShape.FaceHexagon || shape === IcoTileShape.EdgeHexagon
        ? 6
        : shape === IcoTileShape.CornerPentagon ||
            shape === IcoTileShape.Swap1PentagonA ||
            shape === IcoTileShape.Swap1PentagonB ||
            shape === IcoTileShape.Swap2PentagonA ||
            shape === IcoTileShape.Swap2PentagonB ||
            shape === IcoTileShape.Swap3PentagonA ||
            shape === IcoTileShape.Swap3PentagonB
          ? 5
          : 7;
    const xyz = this.interpolateOnFace(
      face.a.xyz,
      face.b.xyz,
      face.c.xyz,
      x,
      y,
    ).normalize();
    const lngLat = xyzToLatLng(xyz);
    this.tiles[index] = {
      index,
      coords: { face, x, y },
      xyz,
      lngLat,
      neighbors: new Array(neighborCount),
      shape,
    };
    return this.tiles[index];
  };

  private readonly createTri = (
    index: number,
    face: Icosahedron.Face,
    a: IcoTile,
    b: IcoTile,
    c: IcoTile,
  ) => {
    this.triangles[index] = { index, face, a, b, c };
    return this.triangles[index];
  };

  private readonly populateEdge = (
    edge: Icosahedron.Edge,
    face: Icosahedron.Face,
  ) => {
    const shape = IcoTileShape.EdgeHexagon;
    for (let i = 0; i < this.widthInTiles - 1; i++) {
      const index = this.getEdgeTileIndex(edge.index, i);
      const s = (i + 1.0) / this.widthInTiles;
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
    tile: IcoTile,
    start: Icosahedron.Point,
    end: Icosahedron.Point,
  ) => {
    if (i === 0) {
      tile.neighbors[3] = this.tiles[start.index];
    } else {
      tile.neighbors[3] = this.tiles[tile.index - 1];
      this.tiles[tile.index - 1].neighbors[0] = tile;
      if (i === this.widthInTiles - 2) {
        tile.neighbors[0] = this.tiles[end.index];
      }
    }
  };

  //----------------------------------------------------------------------------

  private readonly getShapeForChunkCoords = (ci: number, cj: number) => {
    if (!this.doSwaps) return IcoTileShape.FaceHexagon;

    // Swap 1 (bottom-left)
    if ((ci === 2 && cj === 1) || (ci === 4 && cj === 6))
      return IcoTileShape.Swap1PentagonA;
    if ((ci === 2 && cj === 0) || (ci === 4 && cj === 5))
      return IcoTileShape.Swap1PentagonB;
    if ((ci === 1 && cj === 0) || (ci === 3 && cj === 5))
      return IcoTileShape.Swap1HeptagonA;
    if ((ci === 3 && cj === 1) || (ci === 5 && cj === 6))
      return IcoTileShape.Swap1HeptagonB;

    // Swap 2 (bottom-left)
    if ((ci === 6 && cj === 1) || (ci === 1 && cj === 6))
      return IcoTileShape.Swap2PentagonA;
    if ((ci === 5 && cj === 0) || (ci === 0 && cj === 5))
      //|| (ci === 1 && cj === 6))
      return IcoTileShape.Swap2PentagonB;
    if ((ci === 5 && cj === 1) || (ci === 0 && cj === 6))
      return IcoTileShape.Swap2HeptagonA;
    if ((ci === 6 && cj === 0) || (ci === 1 && cj === 5))
      return IcoTileShape.Swap2HeptagonB;

    // Swap 3 (bottom-left)
    if ((ci === 6 && cj === 4) || (ci === 1 && cj === 2))
      return IcoTileShape.Swap3PentagonA;
    if ((ci === 5 && cj === 4) || (ci === 0 && cj === 2))
      return IcoTileShape.Swap3PentagonB;
    if ((ci === 6 && cj === 5) || (ci === 1 && cj === 3))
      return IcoTileShape.Swap3HeptagonA;
    if ((ci === 5 && cj === 3) || (ci === 0 && cj === 1))
      return IcoTileShape.Swap3HeptagonB;

    return IcoTileShape.FaceHexagon;
  };

  private readonly populateFace = (face: Icosahedron.Face) => {
    // Create all tiles for this face ------------------------------------------

    for (let i = 0; i < this.widthInTiles - 1; i++) {
      for (let j = 0; j < i; j++) {
        const index = this.getFaceTileIndex(face.index, i, j);
        const s = (i + 1.0) / this.widthInTiles;
        const t = (j + 1.0) / this.widthInTiles;
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
    for (let i = 0; i < this.widthInTiles; i++) {
      const chunkI = Math.trunc(i / chunkSize);
      const ci = i % chunkSize;

      for (let j = 0; j <= i; j++) {
        const chunkJ = Math.trunc(j / chunkSize);
        const cj = j % chunkSize;
        const chunkIndex =
          face.index * chunksPerFace + chunkI * chunkI + chunkJ * 2;

        // These are named "a", "b", "c", and "d" since these names are short
        const a = this.find(face, i, j);
        const b = this.find(face, i - 1, j - 1);
        const c = this.find(face, i, j - 1);

        if (j < i) {
          const d = this.find(face, i - 1, j);
          const t =
            a.shape === IcoTileShape.Swap1HeptagonB
              ? this.createTri(index, face, a, d, this.find(face, i - 2, j - 1))
              : a.shape === IcoTileShape.Swap2PentagonA
                ? this.createTri(index, face, a, d, this.find(face, i, j - 1))
                : a.shape === IcoTileShape.Swap3PentagonA
                  ? this.createTri(index, face, a, this.find(face, i, j + 1), b)
                  : this.createTri(index, face, a, d, b);
          const chunk = this.chunks[chunkIndex + (cj < ci ? 0 : 1)];
          chunk.triangles[cj < ci ? ci * ci + cj * 2 + 1 : cj * cj + ci * 2] =
            t;
          index++;
        }

        // Check if this tile touches swap 3, 2, or 1
        const t =
          a.shape === IcoTileShape.Swap3HeptagonA
            ? this.createTri(index, face, a, b, this.find(face, i - 1, j - 2))
            : a.shape === IcoTileShape.Swap2PentagonA
              ? this.createTri(index, face, this.find(face, i - 1, j), b, c)
              : a.shape === IcoTileShape.Swap1PentagonA
                ? this.createTri(index, face, this.find(face, i + 1, j), b, c)
                : this.createTri(index, face, a, b, c);

        const chunk = this.chunks[chunkIndex + (cj > ci ? 1 : 0)];
        chunk.triangles[cj > ci ? cj * cj + ci * 2 + 1 : ci * ci + cj * 2] = t;
        index++;
      }
    }

    // Stitch edges to this face's points --------------------------------------

    // A -> B Edge
    for (let i = 0; i < this.widthInTiles - 1; i++) {
      const edgeTile = this.find(face, i, -1);
      edgeTile.neighbors[1] = this.find(face, i + 1, 0);
      edgeTile.neighbors[2] = this.find(face, i, 0);
    }

    // B -> C Edge
    for (let i = 0; i < this.widthInTiles - 1; i++) {
      const edgeTile = this.find(face, this.widthInTiles - 1, i);
      edgeTile.neighbors[4] = this.find(face, this.widthInTiles - 2, i);
      edgeTile.neighbors[5] = this.find(face, this.widthInTiles - 2, i - 1);
    }

    // C -> A Edge
    for (let i = 0; i < this.widthInTiles - 1; i++) {
      const edgeTile = this.find(face, i, i);
      const n0 = this.find(face, i + 1, i);
      const n1 = this.find(face, i, i - 1);
      if (face.index < 5 || face.index >= 15) {
        edgeTile.neighbors[5] = n0;
        edgeTile.neighbors[4] = n1;
      } else {
        edgeTile.neighbors[2] = n0;
        edgeTile.neighbors[1] = n1;
      }
    }

    // Stitch together the rest of this face's points --------------------------

    for (let i = 0; i < this.widthInTiles - 1; i++) {
      for (let j = 0; j < i; j++) {
        const tile = this.find(face, i, j);
        switch (tile.shape) {
          case IcoTileShape.Swap1PentagonA:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j);
            tile.neighbors[4] = this.find(face, i - 1, j - 1);
            break;
          case IcoTileShape.Swap1PentagonB:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i - 1, j);
            tile.neighbors[3] = this.find(face, i - 1, j - 1);
            tile.neighbors[4] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap1HeptagonA:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 2, j + 1);
            tile.neighbors[2] = this.find(face, i + 1, j + 1);
            tile.neighbors[3] = this.find(face, i, j + 1);
            tile.neighbors[4] = this.find(face, i - 1, j);
            tile.neighbors[5] = this.find(face, i - 1, j - 1);
            tile.neighbors[6] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap1HeptagonB:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j);
            tile.neighbors[4] = this.find(face, i - 2, j - 1);
            tile.neighbors[5] = this.find(face, i - 1, j - 1);
            tile.neighbors[6] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap2PentagonA:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j);
            tile.neighbors[4] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap2PentagonB:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i, j + 1);
            tile.neighbors[2] = this.find(face, i - 1, j);
            tile.neighbors[3] = this.find(face, i - 1, j - 1);
            tile.neighbors[4] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap2HeptagonA:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j);
            tile.neighbors[4] = this.find(face, i - 1, j - 1);
            tile.neighbors[5] = this.find(face, i, j - 1);
            tile.neighbors[6] = this.find(face, i + 1, j - 1);
            break;
          case IcoTileShape.Swap2HeptagonB:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j + 1);
            tile.neighbors[4] = this.find(face, i - 1, j);
            tile.neighbors[5] = this.find(face, i - 1, j - 1);
            tile.neighbors[6] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap3PentagonA:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j - 1);
            tile.neighbors[4] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap3PentagonB:
            tile.neighbors[0] = this.find(face, i + 1, j + 1);
            tile.neighbors[1] = this.find(face, i, j + 1);
            tile.neighbors[2] = this.find(face, i - 1, j);
            tile.neighbors[3] = this.find(face, i - 1, j - 1);
            tile.neighbors[4] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap3HeptagonA:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j);
            tile.neighbors[4] = this.find(face, i - 1, j - 1);
            tile.neighbors[5] = this.find(face, i - 1, j - 2);
            tile.neighbors[6] = this.find(face, i, j - 1);
            break;
          case IcoTileShape.Swap3HeptagonB:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i + 1, j + 2);
            tile.neighbors[3] = this.find(face, i, j + 1);
            tile.neighbors[4] = this.find(face, i - 1, j);
            tile.neighbors[5] = this.find(face, i - 1, j - 1);
            tile.neighbors[6] = this.find(face, i, j - 1);
            break;
          default:
            tile.neighbors[0] = this.find(face, i + 1, j);
            tile.neighbors[1] = this.find(face, i + 1, j + 1);
            tile.neighbors[2] = this.find(face, i, j + 1);
            tile.neighbors[3] = this.find(face, i - 1, j);
            tile.neighbors[4] = this.find(face, i - 1, j - 1);
            tile.neighbors[5] = this.find(face, i, j - 1);
            break;
        }
      }
    }
  };
}
