import * as THREE from "three/webgpu";
import {
  cameraProjectionMatrix,
  cameraViewMatrix,
  instanceIndex,
  modelWorldMatrix,
  storage,
  uniform,
  vec4,
  vertexIndex,
  wgslFn,
} from "three/webgpu";

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color());
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  50.0,
  window.innerWidth / window.innerHeight,
  1e-1,
  1e6,
);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x00001f);
camera.position.set(10, 10, 10);

window.addEventListener("resize", onWindowResize, false);

//--------------------------------------------------------------------

let computePositions;

export async function init() {
  await renderer.init();

  const geometry = new THREE.BoxGeometry(10, 10, 10);

  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  const uvs = geometry.attributes.uv.array;
  const indices = (geometry.index as THREE.BufferAttribute).array;

  const referenceBuffer = new THREE.StorageBufferAttribute(positions, 3);
  const positionBuffer = new THREE.StorageBufferAttribute(positions, 3);
  const normalBuffer = new THREE.StorageBufferAttribute(normals, 3);
  const uvBuffer = new THREE.StorageBufferAttribute(uvs, 2);

  // @builtin(global_invocation_id)
  const computeShader = wgslFn(`
      fn compute(
        referenceBuffer: ptr<storage, array<vec3<f32>>, read>,
        positionBuffer: ptr<storage, array<vec3<f32>>, read_write>,
        time: f32
      ) -> void {
        positionBuffer[instanceIndex] = referenceBuffer[instanceIndex] * (0.75 + 0.25 * sin(time));
      }
    `);

  const computeShaderParams = {
    referenceBuffer: storage(
      referenceBuffer,
      "vec3",
      referenceBuffer.count,
    ).toReadOnly(),
    positionBuffer: storage(positionBuffer, "vec3", positionBuffer.count),
    index: instanceIndex,
    time: uniform(0),
  };

  computePositions = computeShader(computeShaderParams).compute(
    indices.length,
    [64],
  );

  /*
  const vertexShader = wgslFn(`
      fn main_vertex(
        projectionMatrix: mat4x4<f32>,
        cameraViewMatrix: mat4x4<f32>,
        modelWorldMatrix: mat4x4<f32>,
        positionBuffer: ptr<storage, array<vec3<f32>>, read>,
        normalBuffer: ptr<storage, array<vec3<f32>>, read>,
        uvBuffer: ptr<storage, array<vec2<f32>>, read>,
        index: u32,
      ) -> vec4<f32> {

        var position = positionBuffer[index];
        var normal = normalBuffer[index];
        var uv = uvBuffer[index];

        var outPosition = projectionMatrix * cameraViewMatrix * modelWorldMatrix * vec4f(position, 1);
    
        return outPosition;
      }
    `);

  const vertexShaderParams = {
    projectionMatrix: cameraProjectionMatrix,
    cameraViewMatrix: cameraViewMatrix,
    modelWorldMatrix: modelWorldMatrix,
    positionBuffer: storage(
      positionBuffer,
      "vec3",
      positionBuffer.count,
    ).toReadOnly(),
    normalBuffer: storage(
      normalBuffer,
      "vec3",
      normalBuffer.count,
    ).toReadOnly(),
    uvBuffer: storage(uvBuffer, "vec2", uvBuffer.count).toReadOnly(),
    index: vertexIndex,
  };

  //You can also create a new bufferGeometry
  const material = new THREE.MeshBasicNodeMaterial();
  material.vertexNode = vertexShader(vertexShaderParams);
  material.fragmentNode = vec4(0, 0.25, 0.75, 1); //just a simple color
  const box = new THREE.Mesh(geometry, material);
  scene.add(box);
  */
}

export async function render() {
  if (!computePositions) return;
  requestAnimationFrame(render);
  renderer.render(scene, camera);

  computePositions.computeNode.parameters.time.value = performance.now() / 1000;
  renderer.compute(computePositions);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
