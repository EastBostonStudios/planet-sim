import { createContext, useContext } from "react";

type RenderCanvasProps = {
  context: GPUCanvasContext;
  format: GPUTextureFormat;
} & {
  width: number;
  height: number;
  aspect: number;
};

export const RenderCanvasContext = createContext<RenderCanvasProps | undefined>(
  undefined,
);

export function useRenderCanvas() {
  const props = useContext(RenderCanvasContext);
  if (!props)
    throw new Error(
      "useRenderCanvas() must be used within a RenderCanvasContext",
    );
  return props;
}
