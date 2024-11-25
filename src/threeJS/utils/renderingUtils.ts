export enum RenderLayerID {
  VisibleCollidable = 0,
  VisibleNonCollidable = 1,
  InvisibleCollidable = 2,
  InvisibleNonCollidable = 3,
}

export const getColorForIndex = (index: number): [number, number, number] => [
  ((index % 3) + 2) / 10,
  ((index % 7) + 2) / 11,
  ((index % 11) + 2) / 15,
];
