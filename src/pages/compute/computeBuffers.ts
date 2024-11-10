import type { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";

export type ComputeBuffers = {
  renderer: WebGPURenderer;
  buffer0: StorageBufferAttribute;
  buffer1: StorageBufferAttribute;
};
