import { mat4 } from "gl-matrix";
import cat from "../assets/cat.jpg";
import { mat4Size, mat4x4Size } from "../math.js";
import type { Scene } from "../model/scene.js";
import { Material } from "./material.js";
import { GlobeMesh } from "./meshes/globeMesh.js";
import shader from "./shaders/shaders.wgsl";

export class Renderer {
  canvas: HTMLCanvasElement;

  // Device/Context objects
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;

  // Pipeline objects
  bindGroup: GPUBindGroup;
  pipeline: GPURenderPipeline;

  // Depth stencil
  depthStencilState: GPUDepthStencilState;
  depthStencilBuffer: GPUTexture;
  depthStencilView: GPUTextureView;
  depthStencilAttachment: GPURenderPassDepthStencilAttachment;

  // Assets
  globeMesh: GlobeMesh;
  material: Material;
  objectBuffer: GPUBuffer;
  tileDataBuffer: GPUBuffer;

  uniformBuffer: GPUBuffer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async Initialize() {
    await this.setupDevice();
    await this.createAssets();
    await this.makeDepthBufferResources();
    await this.makePipeline();
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
    this.depthStencilBuffer = this.device.createTexture({
      size: {
        width: this.canvas.width,
        height: this.canvas.height,
        depthOrArrayLayers: 1,
      },
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const depthStencilDescriptor: GPUTextureViewDescriptor = {
      format: "depth24plus-stencil8",
      dimension: "2d",
      aspect: "all",
    };
    this.depthStencilView = this.depthStencilBuffer.createView(
      depthStencilDescriptor,
    );

    this.depthStencilAttachment = {
      view: this.depthStencilView,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
      stencilLoadOp: "clear",
      stencilStoreOp: "discard",
    };
  }

  async makePipeline() {
    this.uniformBuffer = this.device.createBuffer({
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

    this.bindGroup = this.device.createBindGroup({
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
            buffer: this.tileDataBuffer,
          },
        } as GPUBindGroupEntry,
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
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
      layout: pipelineLayout,
      depthStencil: this.depthStencilState,
    });
  }

  async createAssets() {
    this.globeMesh = new GlobeMesh(this.device);
    this.material = new Material();

    this.objectBuffer = this.device.createBuffer({
      size: mat4x4Size(1024), // Space for up to this many objects
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.tileDataBuffer = this.device.createBuffer({
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
    this.device.queue.writeBuffer(
      this.tileDataBuffer,
      0,
      this.globeMesh.dataArray,
      0,
    );

    //command encoder: records draw commands for submission
    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();

    //texture view: image view to the color buffer in this case
    const textureView: GPUTextureView = this.context
      .getCurrentTexture()
      .createView();

    //renderpass: holds draw commands, allocated from command encoder
    const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        } as GPURenderPassColorAttachment,
      ],
      depthStencilAttachment: this.depthStencilAttachment,
    });
    renderpass.setPipeline(this.pipeline);
    renderpass.setVertexBuffer(0, this.globeMesh.vertexBuffer);
    renderpass.setIndexBuffer(this.globeMesh.indexBuffer, "uint32");
    renderpass.setBindGroup(0, this.bindGroup);
    renderpass.drawIndexed(this.globeMesh.triCount * 3, 1);
    //renderpass.draw(this.globeMesh.vertexCount, 1 /* 1 globe */, 0, 0);

    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
