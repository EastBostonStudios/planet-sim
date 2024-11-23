import { Icosphere } from "../../../board/Icosphere.js";
import { f32Size } from "../../math.js";

export class GlobeMesh {
  dataArray: Float32Array;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  bufferLayout: GPUVertexBufferLayout;
  vertexCount: number;
  triCount: number;

  constructor(device: GPUDevice) {
    const icosphere = new Icosphere(1);

    // x y z u v
    const vertices: Float32Array = new Float32Array(
      icosphere.tiles.flatMap(({ xyz }) => [xyz.x, xyz.y, xyz.z, xyz.x, xyz.z]),
    );
    this.vertexCount = vertices.length / 5;
    const indices = new Uint32Array(
      icosphere.triangles.flatMap(({ a, b, c }) => [a.index, b.index, c.index]),
    );
    this.triCount = indices.length / 3;

    this.dataArray = new Float32Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
      this.dataArray[i] = 0.5 + 0.5 * Math.random();
    }

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
      arrayStride: f32Size(5),
      attributes: [
        {
          shaderLocation: 0,
          offset: f32Size(0),
          format: "float32x3", // XYZ
        } as GPUVertexAttribute,
        {
          shaderLocation: 1,
          offset: f32Size(3),
          format: "float32x2", // UV
        } as GPUVertexAttribute,
      ],
    };
  }
}
