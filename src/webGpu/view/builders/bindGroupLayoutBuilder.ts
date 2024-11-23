export class BindGroupLayoutBuilder {
  label: string;
  bindGroupLayoutEntries: GPUBindGroupLayoutEntry[];
  binding: number;

  private constructor(label: string) {
    this.label = label;
    this.bindGroupLayoutEntries = [];
    this.binding = 0;
    this.reset();
  }

  public static Create(label: string) {
    return new BindGroupLayoutBuilder(label);
  }

  reset() {
    this.bindGroupLayoutEntries = [];
    this.binding = 0;
  }

  addBuffer(
    visibility: GPUShaderStageFlags,
    type: GPUBufferBindingType,
  ): BindGroupLayoutBuilder {
    this.bindGroupLayoutEntries.push({
      binding: this.binding,
      visibility: visibility,
      buffer: {
        type: type,
        hasDynamicOffset: false,
      },
    });
    this.binding += 1;
    return this;
  }

  addMaterial(
    visibility: number,
    type: GPUTextureViewDimension,
  ): BindGroupLayoutBuilder {
    this.bindGroupLayoutEntries.push({
      binding: this.binding,
      visibility: visibility,
      texture: {
        viewDimension: type,
      },
    });
    this.binding += 1;

    this.bindGroupLayoutEntries.push({
      binding: this.binding,
      visibility: visibility,
      sampler: {},
    });
    this.binding += 1;
    return this;
  }

  // buildAsync?
  build(device: GPUDevice): GPUBindGroupLayout {
    const layout = device.createBindGroupLayout({
      label: `${this.label}_bind_group_layout`,
      entries: this.bindGroupLayoutEntries,
    });
    this.reset();
    return layout;
  }
}
