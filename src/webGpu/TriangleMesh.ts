export class TriangleMesh {
  buffer: GPUBuffer;
  bufferLayout: GPUVertexBufferLayout;

  constructor(device: GPUDevice) {
    // x, y, r, u, v
    const vertices = new Float32Array([
      // Point A
      0.0, 0.0, 0.5, 0.5, 0.0,
      // Point B
      0.0, -0.5, -0.5, 0.0, 1.0,
      // Point C
      0.0, 0.0, -0.5, 1.0, 1.0,
    ]);

    const usage: GPUBufferUsageFlags =
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    const descriptor: GPUBufferDescriptor = {
      size: vertices.byteLength,
      usage: usage,
      mappedAtCreation: true,
    };

    this.buffer = device.createBuffer(descriptor);
    new Float32Array(this.buffer.getMappedRange()).set(vertices);
    this.buffer.unmap();

    this.bufferLayout = {
      arrayStride: 20, // 5 32-bit numbers
      attributes: [
        {
          shaderLocation: 0,
          format: "float32x2", // 2 float32s
          offset: 0,
        } as GPUVertexAttribute,
        {
          shaderLocation: 1,
          format: "float32x2", // 2 float32s
          offset: 12,
        } as GPUVertexAttribute,
      ],
    };
  }
}
