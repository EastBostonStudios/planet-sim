import React, { type FC } from "react";

export const ArrayAttribute: FC<{
  attribute: string;
  array: Float32Array;
  itemSize: number;
}> = ({ attribute, array, itemSize }) => {
  return (
    <bufferAttribute
      attach={`attributes-${attribute}`}
      array={array}
      count={array.length / itemSize}
      itemSize={itemSize}
    />
  );
};
