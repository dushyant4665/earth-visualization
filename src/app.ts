// src/app.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { PMREMGenerator } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { loadGlobe } from './components/Globe';

export function initScene() {
  // 1. Canvas Setup
  const canvas = document.getElementById('globe-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // 2. Scene Configuration
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 3.5);

  // 3. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 4. Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  // Sun Light
  const sunLight = new THREE.DirectionalLight(0xfff4e6, 2.5);
  sunLight.position.set(5, 3, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.far = 50;
  scene.add(sunLight);

  // 5. Orbit Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.3;
  controls.minDistance = 2;
  controls.maxDistance = 10;

  // 6. HDR Environment
  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

// Replace the existing HDR loading code with this:
new RGBELoader()
  .setPath('/hdr/')
  .setDataType(THREE.UnsignedByteType) // Important for some HDR formats
  .load('industrial_sunset_2k.hdr', 
    (texture) => {
      const envMap = pmrem.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap;
      texture.dispose();
      loadGlobe(scene);
    },
    undefined, // Progress callback
    (error) => {
      console.error('Failed to load HDR:', error);
      // Fallback to default environment
      loadGlobe(scene);
    }
  );

  // 7. Post-Processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2,
    0.4,
    0.01
  );
  composer.addPass(bloomPass);

  // 8. Sun Visualization
  const sunGeo = new THREE.SphereGeometry(0.2, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xffddaa,
    blending: THREE.AdditiveBlending
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.copy(sunLight.position);
  scene.add(sunMesh);

  // 9. Window Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  // 10. Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
  }

  animate();
}