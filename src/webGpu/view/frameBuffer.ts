export class Framebuffer {
  texture: GPUTexture;
  view: GPUTextureView;
  sampler: GPUSampler;
  bindGroup: GPUBindGroup;

  async initialize(
    device: GPUDevice,
    canvas: HTMLCanvasElement,
    format: GPUTextureFormat,
    bindGroupLayout: GPUBindGroupLayout,
  ) {
    const width = canvas.width;
    const height = canvas.height;

    const textureDescriptor: GPUTextureDescriptor = {
      size: {
        width: width,
        height: height,
      },
      mipLevelCount: 1,
      format: format,
      usage:
        GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    };

    this.texture = device.createTexture(textureDescriptor);

    const viewDescriptor: GPUTextureViewDescriptor = {
      format: format,
      dimension: "2d",
      aspect: "all",
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1,
    };
    this.view = this.texture.createView(viewDescriptor);

    const samplerDescriptor: GPUSamplerDescriptor = {
      magFilter: "linear",
      minFilter: "linear",
    };
    this.sampler = device.createSampler(samplerDescriptor);

    const builder: BindGroupBuilder = new BindGroupBuilder(device);
    builder.setLayout(bindGroupLayout);
    builder.addMaterial(this.view, this.sampler);
    this.bindGroup = await builder.build();
  }
}

class BindGroupBuilder {
  device: GPUDevice;
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupEntry[];
  binding: number;

  constructor(device: GPUDevice) {
    this.device = device;
    this.reset();
  }

  reset() {
    this.entries = [];
    this.binding = 0;
  }

  setLayout(layout: GPUBindGroupLayout) {
    this.layout = layout;
  }

  addBuffer(buffer: GPUBuffer) {
    this.entries.push({
      binding: this.binding,
      resource: {
        buffer: buffer,
      },
    });
    this.binding += 1;
  }

  addMaterial(view: GPUTextureView, sampler: GPUSampler) {
    this.entries.push({
      binding: this.binding,
      resource: view,
    });
    this.binding += 1;

    this.entries.push({
      binding: this.binding,
      resource: sampler,
    });
    this.binding += 1;
  }

  async build(): Promise<GPUBindGroup> {
    if (!this.layout) throw new Error("no layout!");
    if (!this.entries) throw new Error("no entries!");
    const bindGroup = await this.device.createBindGroup({
      label: "post_processing_bind_group",
      layout: this.layout,
      entries: this.entries,
    });

    this.reset();

    return bindGroup;
  }
}
