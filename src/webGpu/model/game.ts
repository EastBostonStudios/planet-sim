import type { Renderer } from "../view/renderer.js";
import { Scene } from "./scene.js";

export class Game {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  scene: Scene;

  forwards_amount: number;
  right_amount: number;
  running = true;

  constructor(renderer: Renderer) {
    this.canvas = renderer.canvas;
    this.renderer = renderer;
    this.scene = new Scene();

    this.forwards_amount = 0;
    this.right_amount = 0;

    document.addEventListener("keydown", (event) =>
      this.handle_keypress(event),
    );
    document.addEventListener("keyup", (event) =>
      this.handle_keyrelease(event),
    );
    this.canvas.onclick = () => this.canvas.requestPointerLock();
    this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
      this.handle_mouse_move(event);
    });
  }

  run = async () => {
    this.scene.update();
    this.scene.move_player(this.forwards_amount, this.right_amount);
    await this.renderer.render(this.scene);

    if (this.running) {
      requestAnimationFrame(this.run);
    }
  };

  handle_keypress(event: KeyboardEvent) {
    if (event.code === "KeyW") {
      this.forwards_amount = 0.02;
    } else if (event.code === "KeyS") {
      this.forwards_amount = -0.02;
    } else if (event.code === "KeyA") {
      this.right_amount = -0.02;
    } else if (event.code === "KeyD") {
      this.right_amount = 0.02;
    } else if (event.code === "Space") {
      this.running = false;
    }
  }

  handle_keyrelease(event: KeyboardEvent) {
    if (event.code === "KeyW") {
      this.forwards_amount = 0;
    } else if (event.code === "KeyS") {
      this.forwards_amount = 0;
    } else if (event.code === "KeyA") {
      this.right_amount = 0;
    } else if (event.code === "KeyD") {
      this.right_amount = 0;
    } else if (event.code === "Space") {
      this.running = true;
      requestAnimationFrame(this.run);
    }
  }

  handle_mouse_move(event: MouseEvent) {
    this.scene.spin_player(event.movementX / 5, event.movementY / 5);
  }
}
