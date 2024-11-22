import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./camera.js";
import { Globe } from "./globe.js";

export class Scene {
  globe: Globe;
  camera: Camera;

  objectData: Float32Array;

  constructor() {
    this.globe = new Globe([2, 0, 0], 0);
    this.objectData = new Float32Array(16 * 1024);
    this.camera = new Camera([-2, 0, 0.5], 0, 0);

    const blank_matrix = mat4.create();
    for (let j = 0; j < 16; j++) {
      this.objectData[j] = blank_matrix[j];
    }
  }

  update() {
    this.globe.update();
    const model = this.globe.model;
    for (let j = 0; j < 16; j++) {
      this.objectData[j] = model[j];
    }
    this.camera.update();
  }

  spin_player(dX: number, dY: number) {
    this.camera.eulers[2] -= dX;
    this.camera.eulers[2] %= 360;

    this.camera.eulers[1] = Math.min(
      89,
      Math.max(-89, this.camera.eulers[1] + dY),
    );
  }

  move_player(forwards_amount: number, right_amount: number) {
    vec3.scaleAndAdd(
      this.camera.position,
      this.camera.position,
      this.camera.forwards,
      forwards_amount,
    );

    vec3.scaleAndAdd(
      this.camera.position,
      this.camera.position,
      this.camera.right,
      right_amount,
    );
  }
}
