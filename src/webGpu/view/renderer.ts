import { mat4 } from "gl-matrix";
import cat from "../assets/cat.jpg";
import { clamp, mat4Size, mat4x4Size } from "../math.js";
import type { Scene } from "../model/scene.js";
import { BindGroupBuilder } from "./builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "./builders/bindGroupLayoutBuilder.js";
import { Material } from "./material.js";
import { GlobeMesh } from "./meshes/globeMesh.js";
import computeShader from "./shaders/compute.wgsl";
import post from "./shaders/post.wgsl";
import shader from "./shaders/shaders.wgsl";

export type RenderResources = {
  canvas: HTMLCanvasElement;
  // adapter: wrapper around (physical) GPU. Describes features and limits
  adapter: GPUAdapter;
  //device: wrapper around GPU functionality. Function calls are made through the device
  device: GPUDevice;
  //context: similar to vulkan instance (or OpenGL context)
  context: GPUCanvasContext;
  format: GPUTextureFormat;
};

export async function requestRenderResources(
  canvas: HTMLCanvasElement,
): Promise<RenderResources> {
  const adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
  const device = <GPUDevice>await adapter?.requestDevice();
  const context = <GPUCanvasContext>canvas.getContext("webgpu");
  const format = "bgra8unorm";
  context.configure({ device, format, alphaMode: "opaque" });
  return {
    canvas,
    adapter,
    device,
    context,
    format,
  };
}

export class Renderer {
  // Core rendering resources
  readonly canvas: HTMLCanvasElement;
  readonly adapter: GPUAdapter;
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;
  readonly format: GPUTextureFormat;
  readonly projection;
  frameNumber: number;

  // Pipeline objects
  computeBindGroupPing: GPUBindGroup;
  computeBindGroupPong: GPUBindGroup;
  computePipeline: GPUComputePipeline;

  renderBindGroup: GPUBindGroup;
  postProcessingBindGroup: GPUBindGroup;
  renderPipeline: GPURenderPipeline;
  postProcessingPipeline: GPURenderPipeline;

  // Depth stencil
  depthStencilState: GPUDepthStencilState = {
    format: "depth24plus-stencil8",
    depthWriteEnabled: true,
    depthCompare: "less-equal",
  };
  depthStencilAttachment: GPURenderPassDepthStencilAttachment;

  // Assets
  globeMesh: GlobeMesh;
  material: Material;

  objectBuffer: GPUBuffer;
  tileDataBufferPing: GPUBuffer;
  tileDataBufferPong: GPUBuffer;
  uniformBuffer: GPUBuffer;

  screenTextureView: GPUTextureView;

  constructor(resources: RenderResources) {
    this.canvas = resources.canvas;
    this.adapter = resources.adapter;
    this.device = resources.device;
    this.context = resources.context;
    this.format = resources.format;
    this.projection = mat4.create();
    this.frameNumber = 0;
  }

  async Initialize() {
    await this.setUpResizeObserver();
    await this.createAssets();
    await this.makeComputePipeline();
    await this.makeRenderPipeline();
    await this.makePostProcessingPipeline();
  }

  async setUpResizeObserver() {
    // Stolen code to support canvas resizing
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
          entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height =
          entry.devicePixelContentBoxSize?.[0].blockSize ||
          entry.contentBoxSize[0].blockSize * devicePixelRatio;
        const maxSize = this.device.limits.maxTextureDimension2D;
        this.canvas.width = clamp(width, 1, maxSize);
        this.canvas.height = clamp(height, 1, maxSize);

        // Recreate the depth buffer and post-processing effect buffers
        this.makePostProcessingPipeline();
      }
    });
    try {
      observer.observe(this.canvas, { box: "device-pixel-content-box" });
    } catch {
      observer.observe(this.canvas, { box: "content-box" });
    }
  }

  async makeComputePipeline() {
    const sizeBuffer = this.device.createBuffer({
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
      .build(this.device);

    this.computeBindGroupPing = BindGroupBuilder.Create("compute_ping", layout)
      .addBuffer(sizeBuffer)
      .addBuffer(this.tileDataBufferPing)
      .addBuffer(this.tileDataBufferPong)
      .build(this.device);

    this.computeBindGroupPong = BindGroupBuilder.Create("compute_pong", layout)
      .addBuffer(sizeBuffer)
      .addBuffer(this.tileDataBufferPong)
      .addBuffer(this.tileDataBufferPing)
      .build(this.device);

    this.device.queue.writeBuffer(
      sizeBuffer,
      0,
      new Float32Array([this.globeMesh.indexBuffer.size, 0]),
    );
    this.device.queue.writeBuffer(
      this.tileDataBufferPing,
      0,
      this.globeMesh.dataArray,
      0,
    );

    // compute pipeline
    this.computePipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [layout],
      }),
      compute: {
        module: this.device.createShaderModule({ code: computeShader }),
        constants: {
          blockSize: 256, // workgroupsize
        },
      },
    });
  }

  async makeRenderPipeline() {
    this.uniformBuffer = this.device.createBuffer({
      label: "uniform_buffer",
      size: 64 * 2, // 64 for each matrix
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const layout = BindGroupLayoutBuilder.Create("render")
      .addBuffer(GPUShaderStage.VERTEX, "uniform")
      .addMaterial(GPUShaderStage.FRAGMENT, "2d") // Two bindings - texture and sampler
      .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
      .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
      .build(this.device);

    this.renderBindGroup = BindGroupBuilder.Create("render", layout)
      .addBuffer(this.uniformBuffer)
      .addMaterial(this.material.view, this.material.sampler)
      .addBuffer(this.objectBuffer)
      .addBuffer(this.tileDataBufferPing)
      .build(this.device);

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });

    this.renderPipeline = this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({ code: shader }),
        entryPoint: "vs_main",
        buffers: [this.globeMesh.bufferLayout],
      },
      fragment: {
        module: this.device.createShaderModule({ code: shader }),
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
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
    const depthStencilBuffer = this.device.createTexture({
      size: {
        width: this.canvas.width,
        height: this.canvas.height,
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
    const screenTextureBuffer = this.device.createTexture({
      size: {
        width: this.canvas.width,
        height: this.canvas.height,
      },
      mipLevelCount: 1,
      format: this.format,
      usage:
        GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.screenTextureView = screenTextureBuffer.createView({
      format: this.format,
      dimension: "2d",
      aspect: "all",
      baseMipLevel: 0,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1,
    });
    const sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    const layout = BindGroupLayoutBuilder.Create("post_processing")
      .addMaterial(GPUShaderStage.FRAGMENT, "2d")
      .build(this.device);

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });
    this.postProcessingPipeline = this.device.createRenderPipeline({
      label: "post_processing_pipeline",
      vertex: {
        module: this.device.createShaderModule({ code: post }),
        entryPoint: "vs_main",
      },
      fragment: {
        module: this.device.createShaderModule({ code: post }),
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: "triangle-list",
      },
      layout: pipelineLayout,
    });

    this.postProcessingBindGroup = BindGroupBuilder.Create(
      "post_processing",
      layout,
    )
      .addMaterial(this.screenTextureView, sampler)
      .build(this.device);
  }

  async createAssets() {
    this.globeMesh = new GlobeMesh(this.device);
    this.material = new Material();

    this.objectBuffer = this.device.createBuffer({
      label: "object_buffer",
      size: mat4x4Size(1024), // Space for up to this many objects
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.tileDataBufferPing = this.device.createBuffer({
      label: "tile_data_buffer_0",
      size: this.globeMesh.dataArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.tileDataBufferPong = this.device.createBuffer({
      label: "tile_data_buffer_1",
      size: this.globeMesh.dataArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    await this.material.initialize(this.device, cat);
  }

  async render(scene: Scene) {
    //--------------------------------------------------------------------------

    // Calculate the camera view and projection matrices
    const aspect = this.canvas.width / this.canvas.height;
    mat4.perspective(this.projection, Math.PI / 4, aspect, 0.1, 100.0);
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      scene.camera.view as ArrayBuffer,
    );
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      mat4x4Size(),
      this.projection as ArrayBuffer,
    );
    this.device.queue.writeBuffer(
      this.objectBuffer,
      0,
      scene.objectData,
      0,
      mat4Size(1 /* Only write one globe */),
    );

    //--------------------------------------------------------------------------

    const commandEncoder = this.device.createCommandEncoder();

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
    const textureView: GPUTextureView = this.context
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

    this.device.queue.submit([commandEncoder.finish()]);
    this.frameNumber++;
  }
}
