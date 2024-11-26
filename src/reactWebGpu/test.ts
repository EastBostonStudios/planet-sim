import { createContext } from "react";

export type RenderPassFunc = (commandEncoder: GPUCommandEncoder) => void;

export const RenderPassContext = createContext<Record<string, RenderPassFunc>>(
  {},
);

export type CanvasData = {
  id: string;
  label: string;
  renderPassFunc: (commandEncoder: GPUCommandEncoder) => void;
};
