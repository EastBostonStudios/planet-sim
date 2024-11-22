import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./camera.js";
import { Triangle } from "./triangle.js";

export class Scene {
  triangles: Triangle[];
  camera: Camera;

  objectData: Float32Array;
  triangleCount: number;

  constructor() {
    this.triangles = [];
    this.objectData = new Float32Array(16 * 1024);
    this.triangleCount = 0;
    this.camera = new Camera([-2, 0, 0.5], 0, 0);

    const blank_matrix = mat4.create();
    for (let i = 0; i < 10; i++) {
      this.triangles.push(new Triangle([2, i - 5, 0], 0));
      for (let j = 0; j < 16; j++) {
        this.objectData[16 * i + j] = blank_matrix[j];
      }
      this.triangleCount++;
    }
  }

  update() {
    for (let i = 0; i < this.triangles.length; i++) {
      const triangle = this.triangles[i];
      triangle.update();
      const model = triangle.model;
      for (let j = 0; j < 16; j++) {
        this.objectData[16 * i + j] = model[j];
      }
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
