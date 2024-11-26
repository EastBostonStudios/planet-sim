import { createContext, useContext, useEffect, useId } from "react";

export type RenderPassFunc = (commandEncoder: GPUCommandEncoder) => void;

export const RenderPassContext = createContext<Record<string, RenderPassFunc>>(
  {},
);

export function useRenderPass(func: RenderPassFunc) {
  const canvases = useContext(RenderPassContext);
  if (!canvases)
    throw new Error("useRenderPass() must be used within a RenderPassContext");
  const id = useId();

  useEffect(() => {
    canvases[id] = func;
    return () => {
      delete canvases[id];
    };
  }, [id, func, canvases]);
}
