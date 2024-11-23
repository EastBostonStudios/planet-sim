import { mat4 } from "gl-matrix";
import cat from "../assets/cat.jpg";
import { mat4Size, mat4x4Size } from "../math.js";
import type { Scene } from "../model/scene.js";
import { Framebuffer } from "./frameBuffer.js";
import { Material } from "./material.js";
import { GlobeMesh } from "./meshes/globeMesh.js";
import computeShader from "./shaders/compute.wgsl";
import post from "./shaders/post.wgsl";
import shader from "./shaders/shaders.wgsl";

export class Renderer {
  canvas: HTMLCanvasElement;

  // Device/Context objects
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;

  // Pipeline objects
  computeBindGroup0: GPUBindGroup;
  computeBindGroup1: GPUBindGroup;
  computePipeline: GPUComputePipeline;

  renderBindGroup: GPUBindGroup;
  postProcessingBindGroup: GPUBindGroup;
  renderPipeline: GPURenderPipeline;
  postProcessingPipeline: GPURenderPipeline;

  // Depth stencil
  depthStencilState: GPUDepthStencilState;
  depthStencilAttachment: GPURenderPassDepthStencilAttachment;

  // Assets
  globeMesh: GlobeMesh;
  material: Material;
  objectBuffer: GPUBuffer;
  tileDataBuffer0: GPUBuffer;
  tileDataBuffer1: GPUBuffer;
  framebuffer: Framebuffer;

  uniformBuffer: GPUBuffer;

  loopTimes: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async Initialize() {
    await this.setupDevice();
    await this.createAssets();
    await this.makeDepthBufferResources();
    await this.makeComputePipeline();
    await this.makeRenderPipeline();
    await this.makePostProcessingPipeline();
  }

  async setupDevice() {
    //adapter: wrapper around (physical) GPU.
    //Describes features and limits
    this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
    //device: wrapper around GPU functionality
    //Function calls are made through the device
    this.device = <GPUDevice>await this.adapter?.requestDevice();
    //context: similar to vulkan instance (or OpenGL context)
    this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
    this.format = "bgra8unorm";
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
    });

    // Stolen code to support canvas resizing
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
          entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height =
          entry.devicePixelContentBoxSize?.[0].blockSize ||
          entry.contentBoxSize[0].blockSize * devicePixelRatio;
        this.canvas.width = Math.max(
          1,
          Math.min(width, this.device.limits.maxTextureDimension2D),
        );
        this.canvas.height = Math.max(
          1,
          Math.min(height, this.device.limits.maxTextureDimension2D),
        );
        // Recreate depth buffer
        this.makeDepthBufferResources();
      }
    });
    try {
      observer.observe(this.canvas, { box: "device-pixel-content-box" });
    } catch {
      observer.observe(this.canvas, { box: "content-box" });
    }
  }

  async makeDepthBufferResources() {
    this.depthStencilState = {
      format: "depth24plus-stencil8",
      depthWriteEnabled: true,
      depthCompare: "less-equal",
    };
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
  }

  async makeComputePipeline() {
    const bindGroupLayoutCompute = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        } as GPUBindGroupLayoutEntry,
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        } as GPUBindGroupLayoutEntry,
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        } as GPUBindGroupLayoutEntry,
      ],
    });

    const sizeBuffer = this.device.createBuffer({
      label: "size_buffer",
      size: 2 * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.UNIFORM |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.VERTEX,
    });
    this.device.queue.writeBuffer(
      sizeBuffer,
      0,
      new Float32Array([this.globeMesh.indexBuffer.size, 0]),
    );

    this.computeBindGroup0 = this.device.createBindGroup({
      layout: bindGroupLayoutCompute,
      entries: [
        { binding: 0, resource: { buffer: sizeBuffer } },
        { binding: 1, resource: { buffer: this.tileDataBuffer0 } },
        { binding: 2, resource: { buffer: this.tileDataBuffer1 } },
      ],
    });
    this.device.queue.writeBuffer(
      this.tileDataBuffer0,
      0,
      this.globeMesh.dataArray,
      0,
    );

    this.computeBindGroup1 = this.device.createBindGroup({
      layout: bindGroupLayoutCompute,
      entries: [
        { binding: 0, resource: { buffer: sizeBuffer } },
        { binding: 1, resource: { buffer: this.tileDataBuffer1 } },
        { binding: 2, resource: { buffer: this.tileDataBuffer0 } },
      ],
    });
    // compute pipeline
    this.computePipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayoutCompute],
      }),
      compute: {
        module: this.device.createShaderModule({ code: computeShader }),
        constants: {
          blockSize: 256, //workgroupsize
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

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        } as GPUBindGroupLayoutEntry,
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "read-only-storage",
            hasDynamicOffset: false,
          },
        } as GPUBindGroupLayoutEntry,
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "read-only-storage",
            hasDynamicOffset: false,
          },
        } as GPUBindGroupLayoutEntry,
      ],
    });

    this.renderBindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        } as GPUBindGroupEntry,
        {
          binding: 1,
          resource: this.material.view,
        } as GPUBindGroupEntry,
        {
          binding: 2,
          resource: this.material.sampler,
        } as GPUBindGroupEntry,
        {
          binding: 3,
          resource: {
            buffer: this.objectBuffer,
          },
        } as GPUBindGroupEntry,
        {
          binding: 4,
          resource: {
            buffer: this.tileDataBuffer0,
          },
        } as GPUBindGroupEntry,
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
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
    const bindGroupLayout = this.device.createBindGroupLayout({
      label: "post_processing_bind_group_layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            viewDimension: "2d",
          },
        } as GPUBindGroupLayoutEntry,
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        } as GPUBindGroupLayoutEntry,
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
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

    this.framebuffer = new Framebuffer();

    await this.framebuffer.initialize(
      this.device,
      this.canvas,
      this.format,
      bindGroupLayout,
    );

    this.postProcessingBindGroup = this.framebuffer.bindGroup;
  }

  async createAssets() {
    this.globeMesh = new GlobeMesh(this.device);
    this.material = new Material();

    this.objectBuffer = this.device.createBuffer({
      label: "object_buffer",
      size: mat4x4Size(1024), // Space for up to this many objects
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.tileDataBuffer0 = this.device.createBuffer({
      label: "tile_data_buffer_0",
      size: this.globeMesh.dataArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.tileDataBuffer1 = this.device.createBuffer({
      label: "tile_data_buffer_1",
      size: this.globeMesh.dataArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    await this.material.initialize(this.device, cat);
  }

  async render(scene: Scene) {
    const projection = mat4.create() as ArrayBuffer;
    mat4.perspective(
      projection as mat4,
      Math.PI / 4,
      this.canvas.width / this.canvas.height,
      0.1,
      100.0,
    );

    const view = scene.camera.view as ArrayBuffer;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, view);
    this.device.queue.writeBuffer(this.uniformBuffer, mat4x4Size(), projection);
    this.device.queue.writeBuffer(
      this.objectBuffer,
      0,
      scene.objectData,
      0,
      mat4Size(1), // Only write one globe
    );

    //command encoder: records draw commands for submission
    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();

    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(
      0,
      this.loopTimes ? this.computeBindGroup1 : this.computeBindGroup0,
    );
    computePass.dispatchWorkgroups(
      Math.ceil(this.globeMesh.indexBuffer.size / 256),
    );
    this.loopTimes = !this.loopTimes;
    computePass.end();

    //renderPass: holds draw commands, allocated from command encoder
    const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.framebuffer.view, // Render to the frame buffer
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
    //renderPass.draw(this.globeMesh.vertexCount, 1 /* 1 globe */, 0, 0);
    renderPass.end();

    //texture view: image view to the color buffer in this case
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
  }
}
