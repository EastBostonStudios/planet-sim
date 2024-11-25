export class BindGroupBuilder {
  readonly label: string;
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupEntry[];
  binding: number;

  private constructor(label: string, layout: GPUBindGroupLayout) {
    this.label = label;
    this.layout = layout;
    this.entries = [];
    this.binding = 0;
    this.reset();
  }

  public static Create(label: string, layout: GPUBindGroupLayout) {
    return new BindGroupBuilder(label, layout);
  }

  reset() {
    this.entries = [];
    this.binding = 0;
  }

  addBuffer(buffer: GPUBuffer) {
    this.entries.push({
      binding: this.binding,
      resource: {
        buffer: buffer,
      },
    });
    this.binding += 1;
    return this;
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
    return this;
  }

  build(device: GPUDevice): GPUBindGroup {
    const bindGroup = device.createBindGroup({
      label: `${this.label}_bind_group`,
      layout: this.layout,
      entries: this.entries,
    });
    this.reset();
    return bindGroup;
  }
}
