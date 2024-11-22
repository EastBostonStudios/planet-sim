import { Icosphere } from "../../../board/Icosphere.js";

export class GlobeMesh {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  bufferLayout: GPUVertexBufferLayout;
  vertexCount: number;
  triCount: number;

  constructor(device: GPUDevice) {
    const icosphere = new Icosphere(0);

    // x y z u v
    const vertices: Float32Array = new Float32Array(
      icosphere.tiles.flatMap(({ xyz }) => [xyz.x, xyz.y, xyz.z, xyz.x, xyz.z]),
    );
    this.vertexCount = vertices.length / 5;
    const indices = new Uint32Array(
      icosphere.triangles.flatMap(({ a, b, c }) => [a.index, b.index, c.index]),
    );
    this.triCount = indices.length / 3;

    this.vertexBuffer = device.createBuffer({
      label: "globe_vertex_buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    this.indexBuffer = device.createBuffer({
      label: "globe_index_buffer",
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.indexBuffer, 0, indices);

    //now define the buffer layout
    this.bufferLayout = {
      arrayStride: 20,
      attributes: [
        {
          shaderLocation: 0,
          format: "float32x3", // XYZ
          offset: 0,
        } as GPUVertexAttribute,
        {
          shaderLocation: 1,
          format: "float32x2", // UV
          offset: 12,
        } as GPUVertexAttribute,
      ],
    };
  }
}
