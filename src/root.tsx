type RenderLoop = () => void;

export type Subscription = {
  ref: React.MutableRefObject<RenderCallback>;
  priority: number;
  store: UseBoundStore<RootState, StoreApi<RootState>>;
};

export type InternalState = {
  active: boolean;
  priority: number;
  frames: number;
  lastEvent: React.MutableRefObject<DomEvent | null>;
  interaction: THREE.Object3D[];
  hovered: Map<string, ThreeEvent<DomEvent>>;
  subscribers: Subscription[];
  capturedMap: Map<number, Map<THREE.Object3D, PointerCaptureTarget>>;
  initialClick: [x: number, y: number];
  initialHits: THREE.Object3D[];
  subscribe: (
    callback: React.MutableRefObject<RenderCallback>,
    priority: number,
    store: UseBoundStore<RootState, StoreApi<RootState>>,
  ) => () => void;
};

interface RenderLoopState {
  passes: RenderLoop[];
  addPass: (pass: RenderLoop) => void;
}
const useRenderLoopStore = create((set) => ({
  passes: () => void [],
  addPass: () => set((prev) => ({ passes: [...passes, pass] })),
  removePass: () => set({ bears: 0 }),
}));
