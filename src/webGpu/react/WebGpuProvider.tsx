import {type FC, useEffect, useState} from "react";
import type {GpuResources} from "../async/requestGpuResources.js";

/**
 * An asynchronous function which requests all the required rendering resources
 * @param canvas The HTML Canvas to get rendering resources for
 */
export async function requestGpuResources(
  canvas: HTMLCanvasElement,
): Promise<GpuResources> {
  if (!navigator.gpu) throw new Error("WebGPU not supported!");

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("WebGPU adapter not provided!");

  const device = await adapter.requestDevice();
  if (!device) throw new Error("WebGPU device unavailable!");

  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("WebGPU canvas context unavailable!");

  const format: GPUTextureFormat = "bgra8unorm";
  context.configure({ device, format, alphaMode: "opaque" });
  return { canvas, adapter, device, context, format };
}

export const WebGpuProvider: FC<> = () => {
  const [gpuResources, setGpuResources] = useState<GpuResources>();

  useEffect(() => {
    requestGpuResources;
  }, []);

  return <Context.Provider>{}</Context.Provider>;
};
