export type RenderResources = {
  canvas: HTMLCanvasElement;
  // adapter: wrapper around (physical) GPU. Describes features and limits
  adapter: GPUAdapter;
  //device: wrapper around GPU functionality. Function calls are made through the device
  device: GPUDevice;
  //context: similar to vulkan instance (or OpenGL context)
  context: GPUCanvasContext;
  format: GPUTextureFormat;
};

/**
 * An asynchronous function which requests all the required rendering resources
 * @param canvas The HTML Canvas to get rendering resources for
 */
export async function requestRenderResources(
  canvas: HTMLCanvasElement,
): Promise<RenderResources> {
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
