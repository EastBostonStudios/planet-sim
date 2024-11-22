import { Renderer } from "../view/renderer.js";
import { Scene } from "./scene.js";

export class Game {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  scene: Scene;

  forwards_amount: number;
  right_amount: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
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

  async Initialize() {
    await this.renderer.Initialize().then(() => {
      console.log("Renderer initialized");
    });
  }

  run = async () => {
    const running = true;

    this.scene.update();
    this.scene.move_player(this.forwards_amount, this.right_amount);
    await this.renderer.render(this.scene);

    if (running) {
      requestAnimationFrame(this.run);
    }
  };

  handle_keypress(event: KeyboardEvent) {
    if (event.code === "KeyW") {
      this.forwards_amount = 0.02;
    }
    if (event.code === "KeyS") {
      this.forwards_amount = -0.02;
    }
    if (event.code === "KeyA") {
      this.right_amount = -0.02;
    }
    if (event.code === "KeyD") {
      this.right_amount = 0.02;
    }
  }

  handle_keyrelease(event: KeyboardEvent) {
    if (event.code === "KeyW") {
      this.forwards_amount = 0;
    }
    if (event.code === "KeyS") {
      this.forwards_amount = 0;
    }
    if (event.code === "KeyA") {
      this.right_amount = 0;
    }
    if (event.code === "KeyD") {
      this.right_amount = 0;
    }
  }

  handle_mouse_move(event: MouseEvent) {
    this.scene.spin_player(event.movementX / 10, -event.movementY / 10);
  }
}
