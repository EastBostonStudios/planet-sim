import { mat4, vec3 } from "gl-matrix";
import { degToRad } from "../math.js";

export class Globe {
  readonly position: vec3;
  readonly eulers: vec3;
  readonly model: mat4;
  constructor(position: vec3, theta: number) {
    this.position = position;
    this.eulers = vec3.create();
    this.eulers[2] = theta;
    this.model = mat4.create();
  }

  update() {
    this.eulers[2] += 0.2;
    this.eulers[2] %= 360;

    this.model = mat4.create();
    mat4.translate(this.model, this.model, this.position);
    mat4.rotateZ(this.model, this.model, degToRad(this.eulers[2]));
  }

  getModel() {
    return this.model;
  }
}
