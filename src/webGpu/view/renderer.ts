import { mat4 } from "gl-matrix";
import type { RenderAssets } from "../init/createAssets.js";
import type { RenderResources } from "../init/requestRenderResources.js";
import { clamp, mat4Size, mat4x4Size } from "../math.js";
import type { Scene } from "../model/scene.js";
import { BindGroupBuilder } from "./builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "./builders/bindGroupLayoutBuilder.js";
import type { Material } from "./material.js";
import type { GlobeMesh } from "./meshes/globeMesh.js";
import computeShader from "./shaders/compute.wgsl";
import post from "./shaders/post.wgsl";
import shader from "./shaders/shaders.wgsl";

export class Renderer {
  // Core rendering resources
  readonly resources: RenderResources;

  readonly projection;
  frameNumber: number;

  // Pipeline objects
  computeBindGroupPing: GPUBindGroup;
  computeBindGroupPong: GPUBindGroup;
  renderBindGroup: GPUBindGroup;
  postProcessingBindGroup: GPUBindGroup;

  computePipeline: GPUComputePipeline;
  renderPipeline: GPURenderPipeline;
  postProcessingPipeline: GPURenderPipeline;

  // Depth stencil
  readonly depthStencilState: GPUDepthStencilState = {
    format: "depth24plus-stencil8",
    depthWriteEnabled: true,
    depthCompare: "less-equal",
  };
  depthStencilAttachment: GPURenderPassDepthStencilAttachment;

  // Post processing
  screenTextureView: GPUTextureView;

  // Assets
  globeMesh: GlobeMesh;
  material: Material;
  uniformBuffer: GPUBuffer;
  objectBuffer: GPUBuffer;
  tileDataBufferPing: GPUBuffer;
  tileDataBufferPong: GPUBuffer;

  constructor(resources: RenderResources, assets: RenderAssets) {
    this.resources = resources;
    this.projection = mat4.create();
    this.frameNumber = 0;

    this.globeMesh = assets.globeMesh;
    this.material = assets.material;
    this.uniformBuffer = assets.uniformBuffer;
    this.objectBuffer = assets.objectBuffer;
    this.tileDataBufferPing = assets.tileDataBufferPing;
    this.tileDataBufferPong = assets.tileDataBufferPong;
  }

  async Initialize() {
    // Stolen code to support canvas resizing
    const observer = new ResizeObserver(async (entries) => {
      for (const entry of entries) {
        const width =
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
          entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height =
          entry.devicePixelContentBoxSize?.[0].blockSize ||
          entry.contentBoxSize[0].blockSize * devicePixelRatio;
        const maxSize = this.resources.device.limits.maxTextureDimension2D;
        this.resources.canvas.width = clamp(width, 1, maxSize);
        this.resources.canvas.height = clamp(height, 1, maxSize);

        // Recreate the depth buffer and post-processing effect buffers
        this.postProcessingPipeline = await this.makePostProcessingPipeline();
      }
    });
    try {
      observer.observe(this.resources.canvas, {
        box: "device-pixel-content-box",
      });
    } catch {
      observer.observe(this.resources.canvas, { box: "content-box" });
    }

    this.computePipeline = await this.makeComputePipeline();
    this.renderPipeline = await this.makeRenderPipeline();
    this.postProcessingPipeline = await this.makePostProcessingPipeline();
    return this;
  }

  async makeComputePipeline() {
    const sizeBuffer = this.resources.device.createBuffer({
      label: "size_buffer",
      size: 2 * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.UNIFORM |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.VERTEX,
    });

    const layout = BindGroupLayoutBuilder.Create("compute")
      .addBuffer(GPUShaderStage.COMPUTE, "read-only-storage")
      .addBuffer(GPUShaderStage.COMPUTE, "read-only-storage")
      .addBuffer(GPUShaderStage.COMPUTE, "storage")
      .build(this.resources.device);

    this.computeBindGroupPing = BindGroupBuilder.Create("compute_ping", layout)
      .addBuffer(sizeBuffer)
      .addBuffer(this.tileDataBufferPing)
      .addBuffer(this.tileDataBufferPong)
      .build(this.resources.device);

    this.computeBindGroupPong = BindGroupBuilder.Create("compute_pong", layout)
      .addBuffer(sizeBuffer)
      .addBuffer(this.tileDataBufferPong)
      .addBuffer(this.tileDataBufferPing)
      .build(this.resources.device);

    this.resources.device.queue.writeBuffer(
      sizeBuffer,
      0,
      new Float32Array([this.globeMesh.indexBuffer.size, 0]),
    );
    this.resources.device.queue.writeBuffer(
      this.tileDataBufferPing,
      0,
      this.globeMesh.dataArray,
      0,
    );

    // compute pipeline
    return this.resources.device.createComputePipeline({
      layout: this.resources.device.createPipelineLayout({
        bindGroupLayouts: [layout],
      }),
      compute: {
        module: this.resources.device.createShaderModule({
          code: computeShader,
        }),
        constants: {
          blockSize: 256, // workgroupsize
        },
      },
    });
  }

  async makeRenderPipeline() {
    const layout = BindGroupLayoutBuilder.Create("render")
      .addBuffer(GPUShaderStage.VERTEX, "uniform")
      .addMaterial(GPUShaderStage.FRAGMENT, "2d") // Two bindings - texture and sampler
      .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
      .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
      .build(this.resources.device);

    this.renderBindGroup = BindGroupBuilder.Create("render", layout)
      .addBuffer(this.uniformBuffer)
      .addMaterial(this.material.view, this.material.sampler)
      .addBuffer(this.objectBuffer)
      .addBuffer(this.tileDataBufferPing)
      .build(this.resources.device);

    const pipelineLayout = this.resources.device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });

    return this.resources.device.createRenderPipeline({
      vertex: {
        module: this.resources.device.createShaderModule({ code: shader }),
        entryPoint: "vs_main",
        buffers: [this.globeMesh.bufferLayout],
      },
      fragment: {
        module: this.resources.device.createShaderModule({ code: shader }),
        entryPoint: "fs_main",
        targets: [{ format: this.resources.format }],
      },
      primitive: {
        topology: "triangle-list",
      },
      depthStencil: this.depthStencilState,
      layout: pipelineLayout,
    });
  }

  async makePostProcessingPipeline() {
    //--------------------------------------------------------------------------
    // Depth buffer
    const depthStencilBuffer = this.resources.device.createTexture({
      size: {
        width: this.resources.canvas.width,
        height: this.resources.canvas.height,
        depthOrArrayLayers: 1,
      },
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const depthStencilView = depthStencilBuffer.createView({
      format: "depth24plus-stencil8",
      dimension: "2d",
      aspect: "all",
    });
    this.depthStencilAttachment = {
      view: depthStencilView,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
      stencilLoadOp: "clear",
      stencilStoreOp: "discard",
    };

    //--------------------------------------------------------------------------
    // Screen texture
    const screenTextureBuffer = this.resources.device.createTexture({
      size: {
        width: this.resources.canvas.width,
        height: this.resources.canvas.height,
      },
      mipLevelCount: 1,
      format: this.resources.format,
      usage:
        GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.screenTextureView = screenTextureBuffer.createView({
      format: this.resources.format,
      dimension: "2d",
      aspect: "all",
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1,
    });
    const sampler = this.resources.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    const layout = BindGroupLayoutBuilder.Create("post_processing")
      .addMaterial(GPUShaderStage.FRAGMENT, "2d")
      .build(this.resources.device);

    this.postProcessingBindGroup = BindGroupBuilder.Create(
      "post_processing",
      layout,
    )
      .addMaterial(this.screenTextureView, sampler)
      .build(this.resources.device);

    const pipelineLayout = this.resources.device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });
    return this.resources.device.createRenderPipeline({
      label: "post_processing_pipeline",
      vertex: {
        module: this.resources.device.createShaderModule({ code: post }),
        entryPoint: "vs_main",
      },
      fragment: {
        module: this.resources.device.createShaderModule({ code: post }),
        entryPoint: "fs_main",
        targets: [{ format: this.resources.format }],
      },
      primitive: {
        topology: "triangle-list",
      },
      layout: pipelineLayout,
    });
  }

  async render(scene: Scene) {
    //--------------------------------------------------------------------------
    // Calculate the camera view and projection matrices
    const aspect = this.resources.canvas.width / this.resources.canvas.height;
    mat4.perspective(this.projection, Math.PI / 4, aspect, 0.1, 100.0);
    this.resources.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      scene.camera.view as ArrayBuffer,
    );
    this.resources.device.queue.writeBuffer(
      this.uniformBuffer,
      mat4x4Size(),
      this.projection as ArrayBuffer,
    );

    // Write the object matrix buffer to the GPU
    this.resources.device.queue.writeBuffer(
      this.objectBuffer,
      0,
      scene.objectData,
      0,
      mat4Size(1 /* Only write one globe */),
    );

    //--------------------------------------------------------------------------

    const commandEncoder = this.resources.device.createCommandEncoder();

    //--------------------------------------------------------------------------
    const computeBindGroup =
      this.frameNumber % 2 === 0
        ? this.computeBindGroupPing
        : this.computeBindGroupPong;
    const dispatchCount = Math.ceil(this.globeMesh.indexBuffer.size / 256);
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(dispatchCount);
    computePass.end();

    //--------------------------------------------------------------------------
    const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.screenTextureView, // Render to the frame buffer
          loadOp: "clear",
          storeOp: "store",
        } as GPURenderPassColorAttachment,
      ],
      depthStencilAttachment: this.depthStencilAttachment,
    });
    renderPass.setPipeline(this.renderPipeline);
    renderPass.setVertexBuffer(0, this.globeMesh.vertexBuffer);
    renderPass.setIndexBuffer(this.globeMesh.indexBuffer, "uint32");
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.drawIndexed(this.globeMesh.triCount * 3, 1);
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
    postProcessingPass.setPipeline(this.postProcessingPipeline);
    postProcessingPass.setBindGroup(0, this.postProcessingBindGroup);
    postProcessingPass.draw(3, 1, 0, 0);
    postProcessingPass.end();

    this.resources.device.queue.submit([commandEncoder.finish()]);
    this.frameNumber++;
  }
}
