import type { GroupProps } from "@react-three/fiber";
import React, { useContext, type FC, type ReactNode } from "react";
import styled from "styled-components";
import type { Vector3 } from "three";
import { AppContext } from "../App";
import { HtmlOverlay3D } from "../utils/HtmlOverlay";

const StyledHtml = styled.strong<{ $color: string }>`
  color: ${({ $color }) => $color};
  pointer-events: none;
  font-size: 12px;
  text-shadow: 1px 1px black;
`;

export const StyledLabel: FC<
  {
    color?: string;
    position: Vector3;
    children: ReactNode;
  } & Partial<GroupProps>
> = ({ color, position, children }) => {
  const { is3D } = useContext(AppContext);
  return (
    <HtmlOverlay3D
      key={is3D ? "3D" : "2D"}
      x={position.x}
      y={position.y}
      z={position.z}
      noOcclusion
    >
      <StyledHtml $color={color ?? "white"}>{children}</StyledHtml>
    </HtmlOverlay3D>
  );
};
