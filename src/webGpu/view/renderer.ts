import { mat4 } from "gl-matrix";
import type { ComputePass } from "../init/createComputePass.js";
import {
  type PostProcessingPass,
  createPostProcessingPass,
} from "../init/createPostProcessingPass.js";
import type { TerrainPass } from "../init/createTerrainRenderPass.js";
import type { GpuBuffers } from "../init/gpuBuffers.js";
import type { GpuResources } from "../init/requestGpuResources.js";
import type { ScreenSpaceBuffers } from "../init/screenSpaceBuffers.js";
import { mat4Size, mat4x4Size } from "../math.js";
import type { Scene } from "../model/scene.js";

export class Renderer {
  readonly projection;
  readonly scene: Scene;

  // Core rendering resources
  readonly resources: GpuResources;
  readonly buffers: GpuBuffers;
  readonly screenBuffers: ScreenSpaceBuffers;
  readonly computePass: ComputePass;
  readonly terrainPass: TerrainPass;
  readonly postProcessingPass: PostProcessingPass;

  constructor(
    resources: GpuResources,
    buffers: GpuBuffers,
    screenBuffers: ScreenSpaceBuffers,
    computePipeline: ComputePass,
    renderPipeline: TerrainPass,
    scene: Scene,
  ) {
    this.projection = mat4.create();
    this._frame = 0;

    this.resources = resources;
    this.buffers = buffers;
    this.screenBuffers = screenBuffers;
    this.computePass = computePipeline;
    this.terrainPass = renderPipeline;
    this.postProcessingPass = createPostProcessingPass(
      resources,
      screenBuffers,
    );
    this.scene = scene;
  }

  //----------------------------------------------------------------------------

  private _frame: number;

  get frame() {
    return this._frame;
  }

  _running = false;

  get running() {
    return this._running;
  }

  set running(value: boolean) {
    if (!this._running && value) {
      this._running = value;
      this.render();
    } else this._running = value;
  }

  async render() {
    console.log(this);
    this.scene.update();

    //--------------------------------------------------------------------------
    // Calculate the camera view and projection matrices
    this.resources.canvas.width = this.screenBuffers.width;
    this.resources.canvas.height = this.screenBuffers.height;
    const aspect = this.resources.canvas.width / this.resources.canvas.height;
    mat4.perspective(this.projection, Math.PI / 4, aspect, 0.1, 100.0);
    this.resources.device.queue.writeBuffer(
      this.buffers.uniformBuffer,
      0,
      this.scene.camera.view as ArrayBuffer,
    );
    this.resources.device.queue.writeBuffer(
      this.buffers.uniformBuffer,
      mat4x4Size(),
      this.projection as ArrayBuffer,
    );

    // Write the object matrix buffer to the GPU
    this.resources.device.queue.writeBuffer(
      this.buffers.objectBuffer,
      0,
      this.scene.objectData,
      0,
      mat4Size(1 /* Only write one globe */),
    );

    //--------------------------------------------------------------------------

    const commandEncoder = this.resources.device.createCommandEncoder();

    //--------------------------------------------------------------------------
    const computeBindGroup =
      this._frame % 2 === 0
        ? this.computePass.bindGroupPing
        : this.computePass.bindGroupPong;
    const dispatchCount = Math.ceil(
      this.buffers.globeMesh.indexBuffer.size / 256,
    );
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePass.pipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(dispatchCount);
    computePass.end();

    //--------------------------------------------------------------------------

    const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.screenBuffers.screenTextureView, // Render to the frame buffer
          loadOp: "clear",
          storeOp: "store",
        } as GPURenderPassColorAttachment,
      ],
      depthStencilAttachment: this.terrainPass.depthStencilAttachment,
    });
    renderPass.setPipeline(this.terrainPass.pipeline);
    renderPass.setVertexBuffer(0, this.buffers.globeMesh.vertexBuffer);
    renderPass.setIndexBuffer(this.buffers.globeMesh.indexBuffer, "uint32");
    renderPass.setBindGroup(0, this.terrainPass.bindGroup);
    renderPass.drawIndexed(this.buffers.globeMesh.triCount * 3, 1);
    // renderPass.draw(this.globeMesh.vertexCount, 1 /* 1 globe */, 0, 0);
    renderPass.end();

    //--------------------------------------------------------------------------
    const textureView: GPUTextureView = this.resources.context
      .getCurrentTexture()
      .createView();
    const postProcessingPass: GPURenderPassEncoder =
      commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            loadOp: "clear",
            storeOp: "store",
          } as GPURenderPassColorAttachment,
        ],
      });
    postProcessingPass.setPipeline(this.postProcessingPass.pipeline);
    postProcessingPass.setBindGroup(0, this.postProcessingPass.bindGroup);
    postProcessingPass.draw(3, 1, 0, 0);
    postProcessingPass.end();

    this.resources.device.queue.submit([commandEncoder.finish()]);
    this._frame++;

    if (this._running) {
      requestAnimationFrame(this.render);
    }
  }
}
