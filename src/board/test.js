if (!Detector.webgl) Detector.addGetWebGLMessage();

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var container, camera, scene, renderer;

var cameraControls;

var controls = {
  painters: false,
};

var clock = new THREE.Clock();

var tess = 6,
  newTess = tess;

var tessLevel = [2, 3, 4, 6, 8, 10, 12, 16, 24, 32, 48, 64, 128, 256];
var maxTessLevel = tessLevel.length - 1;

var flat = true,
  newFlat = flat;

var light1, light2;
var sphere, sphereFlatMaterial, sphereSmoothMaterial;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  // CAMERA

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    80000,
  );
  camera.position.set(-1000, 450, -1300);

  // SCENE

  scene = new THREE.Scene();

  scene.add(camera);

  // LIGHTS

  scene.add(new THREE.AmbientLight(0x222222));

  light1 = new THREE.DirectionalLight(0xffffff, 1.0);
  light1.position.set(200, 400, 500);

  scene.add(light1);

  light2 = new THREE.DirectionalLight(0xffffff, 1.0);
  light2.position.set(-400, 200, -300);

  scene.add(light2);

  // RENDERER

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.setClearColorHex(0xaaaaaa, 1.0);
  renderer.setClearColorHex(0xaaaaaa, 1.0);

  container.appendChild(renderer.domElement);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  // EVENTS

  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("keydown", onKeyDown, false);
  document.addEventListener("keyup", onKeyUp, false);

  // CONTROLS

  cameraControls = new THREE.TrackballControls(camera, renderer.domElement);
  cameraControls.target.set(0, 0, 0);

  // MATERIALS
  // Note: setting per pixel off does not affect the specular highlight, annoyingly
  sphereFlatMaterial = new THREE.MeshPhongMaterial({
    color: 0x700505,
    specular: 0x505050,
    shininess: 10,
    shading: THREE.FlatShading,
  });
  sphereSmoothMaterial = new THREE.MeshPhongMaterial({
    color: 0x700505,
    specular: 0x505050,
    shininess: 10,
    perPixel: false,
  });

  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(500, tessLevel[tess] * 2, tessLevel[tess]),
    flat ? sphereFlatMaterial : sphereSmoothMaterial,
  );

  scene.add(sphere);
}

// EVENT HANDLERS

function onWindowResize(event) {
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  camera.updateProjectionMatrix();
}

function onKeyDown(event) {
  switch (event.keyCode) {
    case 38:
      /*up*/ newTess++;
      if (newTess > maxTessLevel) {
        newTess = maxTessLevel;
      }
      break;

    case 40:
      /*down*/ newTess--;
      if (newTess < 0) {
        newTess = 0;
      }
      break;

    case 84: /* T */
    case 116 /* T */:
      newFlat = !newFlat;
  }
}

function onKeyUp(event) {
  switch (event.keyCode) {
  }
}

//

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  var delta = clock.getDelta();

  cameraControls.update(delta);

  if (newTess != tess || newFlat != flat) {
    tess = newTess;
    flat = newFlat;

    fillScene();
  }

  renderer.render(scene, camera);
}

function fillScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x808080, 2000, 4000);

  scene.add(camera);

  // LIGHTS

  scene.add(new THREE.AmbientLight(0x222222));
  scene.add(light1);
  scene.add(light2);

  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(500, tessLevel[tess] * 2, tessLevel[tess]),
    flat ? sphereFlatMaterial : sphereSmoothMaterial,
  );

  scene.add(sphere);
}
