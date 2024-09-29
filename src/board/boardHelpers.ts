import { GameBoardTileShape } from "./GameBoard";

export const getShapeName = (shape: GameBoardTileShape) => {
  switch (shape) {
    case GameBoardTileShape.Swap1PentagonA:
      return "S1-5A";
    case GameBoardTileShape.Swap1PentagonB:
      return "S1-5B";
    case GameBoardTileShape.Swap1HeptagonA:
      return "S1-7A";
    case GameBoardTileShape.Swap1HeptagonB:
      return "S1-7B";
    case GameBoardTileShape.Swap2PentagonA:
      return "S2-5A";
    case GameBoardTileShape.Swap2PentagonB:
      return "S2-5B";
    case GameBoardTileShape.Swap2HeptagonA:
      return "S2-7A";
    case GameBoardTileShape.Swap2HeptagonB:
      return "S2-7B";
    case GameBoardTileShape.Swap3PentagonA:
      return "S3-5A";
    case GameBoardTileShape.Swap3PentagonB:
      return "S3-5B";
    case GameBoardTileShape.Swap3HeptagonA:
      return "S3-7A";
    case GameBoardTileShape.Swap3HeptagonB:
      return "S3-7B";
    default:
      return undefined; //`t${tile.index}`;
  }
};
