export class Material {
  texture: GPUTexture;
  view: GPUTextureView;
  sampler: GPUSampler;

  async initialize(device: GPUDevice, url: string) {
    const response: Response = await fetch(url);
    const blob: Blob = await response.blob();
    const imageData: ImageBitmap = await createImageBitmap(blob);
    this.loadImageBitmap(device, imageData);
    this.view = this.texture.createView({
      format: "rgba8unorm",
      dimension: "2d",
      aspect: "all",
      baseMipLevel: 0,
      mipLevelCount: 1,
      arrayLayerCount: 1,
    });
    this.sampler = device.createSampler({
      addressModeU: "repeat",
      addressModeV: "repeat",
      magFilter: "linear",
      minFilter: "nearest",
      mipmapFilter: "linear",
      maxAnisotropy: 1,
    });
  }

  private loadImageBitmap(device: GPUDevice, imageData: ImageBitmap) {
    const textureDescriptor: GPUTextureDescriptor = {
      size: {
        width: imageData.width,
        height: imageData.height,
      },
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    };

    this.texture = device.createTexture(textureDescriptor);

    device.queue.copyExternalImageToTexture(
      { source: imageData },
      { texture: this.texture },
      textureDescriptor.size,
    );
  }
}
