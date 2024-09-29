import { IcoTileShape, type Icosphere } from "./Icosphere";

export const getShapeName = (shape: IcoTileShape) => {
  switch (shape) {
    case IcoTileShape.Swap1PentagonA:
      return "S1-5A";
    case IcoTileShape.Swap1PentagonB:
      return "S1-5B";
    case IcoTileShape.Swap1HeptagonA:
      return "S1-7A";
    case IcoTileShape.Swap1HeptagonB:
      return "S1-7B";
    case IcoTileShape.Swap2PentagonA:
      return "S2-5A";
    case IcoTileShape.Swap2PentagonB:
      return "S2-5B";
    case IcoTileShape.Swap2HeptagonA:
      return "S2-7A";
    case IcoTileShape.Swap2HeptagonB:
      return "S2-7B";
    case IcoTileShape.Swap3PentagonA:
      return "S3-5A";
    case IcoTileShape.Swap3PentagonB:
      return "S3-5B";
    case IcoTileShape.Swap3HeptagonA:
      return "S3-7A";
    case IcoTileShape.Swap3HeptagonB:
      return "S3-7B";
    case IcoTileShape.SpecialEdgeHexagon:
      return "ASDF";
    default:
      return undefined; //`t${tile.index}`;
  }
};

export const validateBoard = (board: Icosphere) => {
  for (let i = 0; i < board.tiles.length; i++) {
    const tile = board.tiles[i];
    console.assert(tile !== undefined, `Tile ${tile.index} undefined`);
    console.assert(tile.index === i, `Tile ${tile.index} not at index ${i}`);

    for (let j = 0; j < tile.neighbors.length; j++) {
      const neighbor = tile.neighbors[j];
      console.assert(
        neighbor !== undefined,
        `Tile ${tile.index} neighbor ${j} undefined`,
      );
      console.assert(
        neighbor.neighbors.some(
          (neighborOfNeighbor) => neighborOfNeighbor === tile,
        ),
        `Tile's ${tile.index} neighbor ${j} doesn't neighbor board tile`,
      );
    }
  }
  for (let i = 0; i < board.triangles.length; i++) {
    const triangle = board.triangles[i];
    console.assert(
      triangle !== undefined,
      `Triangle ${triangle.index} undefined`,
    );
    console.assert(
      triangle.index === i,
      `Triangle ${triangle.index} not at index ${i}`,
    );
  }
  for (let i = 0; i < board.chunks.length; i++) {
    const chunk = board.chunks[i];
    console.assert(chunk !== undefined, `Chunk ${chunk.index} undefined`);
    console.assert(chunk.index === i, `Chunk ${chunk.index} not at index ${i}`);
    for (let j = 0; j < chunk.triangles.length; j++) {
      console.assert(
        chunk.triangles[j] !== undefined,
        `Chunk ${chunk.index} triangle ${j} undefined`,
      );
    }
  }
};
