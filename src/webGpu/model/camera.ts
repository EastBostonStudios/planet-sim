import { mat4, vec3 } from "gl-matrix";
import { degToRad } from "./math.js";

export class Camera {
  position: vec3;
  eulers: vec3;
  view: mat4;
  forwards: vec3;
  right: vec3;
  up: vec3;

  constructor(position: vec3, theta: number, phi: number) {
    this.position = position;
    this.eulers = [0, theta, phi];
    this.forwards = vec3.create();
    this.right = vec3.create();
    this.up = vec3.create();
    this.view = mat4.create();
  }

  update() {
    this.forwards = [
      Math.cos(degToRad(this.eulers[2])) * Math.cos(degToRad(this.eulers[1])),
      Math.sin(degToRad(this.eulers[2])) * Math.cos(degToRad(this.eulers[1])),
      Math.sin(degToRad(this.eulers[1])),
    ];
    vec3.cross(this.right, this.forwards, [0, 0, 1]);
    vec3.cross(this.up, this.right, this.forwards);

    const target = vec3.create();
    vec3.add(target, this.position, this.forwards);

    mat4.lookAt(this.view, this.position, target, this.up);
  }

  getView() {
    return this.view;
  }
}
