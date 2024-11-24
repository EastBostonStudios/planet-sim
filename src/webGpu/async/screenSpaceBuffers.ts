import type { GpuResources } from "./requestGpuResources.js";

// Buffers & views tied to screen space
export type ScreenSpaceBuffers = {
  width: number;
  height: number;
  depthTextureView: GPUTextureView;
  screenTextureView: GPUTextureView;
};

export async function allocateScreenSpaceBuffers(
  { device, format }: GpuResources,
  width: number,
  height: number,
): Promise<ScreenSpaceBuffers> {
  //--------------------------------------------------------------------------

  // Depth buffer
  const depthTexture = device.createTexture({
    label: "depth_texture",
    size: {
      width: width,
      height: height,
      depthOrArrayLayers: 1,
    },
    format: "depth24plus-stencil8",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const depthTextureView = depthTexture.createView({
    label: "depth_texture_view",
    format: "depth24plus-stencil8",
    dimension: "2d",
    aspect: "all",
  });

  //--------------------------------------------------------------------------
  // Screen texture (for post-processing)
  const screenTexture = device.createTexture({
    label: "screen_texture",
    size: {
      width: width,
      height: height,
    },
    mipLevelCount: 1,
    format: format,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const screenTextureView = screenTexture.createView({
    label: "screen_texture_view",
    format: format,
    dimension: "2d",
    aspect: "all",
    baseMipLevel: 0,
    mipLevelCount: 1,
    baseArrayLayer: 0,
    arrayLayerCount: 1,
  });

  return { width, height, depthTextureView, screenTextureView };
}
