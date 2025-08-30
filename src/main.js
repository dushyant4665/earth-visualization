import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const EARTH_SEGMENTS = 128;
const STAR_COUNT = 8000;
const MAX_FPS = 60;
const TARGET_FPS = 60;

let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0.5, 4.5);

const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: 'high-performance',
  failIfMajorPerformanceCaveat: false,
  preserveDrawingBuffer: false
});

if (!renderer.capabilities.isWebGL2) {
  console.warn('WebGL2 not supported, falling back to WebGL1');
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
if (THREE.SRGBColorSpace !== undefined) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} else {
  renderer.outputEncoding = THREE.sRGBEncoding;
}
document.body.appendChild(renderer.domElement);

let controls;
try {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2.5;
  controls.maxDistance = 12;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
} catch (error) {
  console.error('Failed to initialize controls:', error);
  controls = null;
}

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.15,
  transparent: true,
  opacity: 0.9,
  sizeAttenuation: true
});

const starVertices = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT; i++) {
  const i3 = i * 3;
  starVertices[i3] = THREE.MathUtils.randFloatSpread(1500);
  starVertices[i3 + 1] = THREE.MathUtils.randFloatSpread(1500);
  starVertices[i3 + 2] = THREE.MathUtils.randFloatSpread(1500);
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(10, 5, 10);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
rimLight.position.set(-10, -5, -10);
scene.add(rimLight);

// Earth
const earthGeometry = new THREE.SphereGeometry(1, EARTH_SEGMENTS, EARTH_SEGMENTS);
const earthMaterial = new THREE.MeshPhongMaterial({
  shininess: 20,
  specular: 0x333333
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Atmosphere
const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
const atmosphereMaterial = new THREE.MeshPhongMaterial({
  color: 0x87ceeb,
  transparent: true,
  opacity: 0.08,
  side: THREE.BackSide
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
earth.add(atmosphere);

const textureLoader = new THREE.TextureLoader();
const loadTexture = (path) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Texture loading timeout: ${path}`));
    }, 10000);

    textureLoader.load(
      path,
      (texture) => {
        clearTimeout(timeout);
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 16);
        resolve(texture);
      },
      undefined,
      (error) => {
        clearTimeout(timeout);
        console.error('Error loading texture:', path, error);
        reject(error);
      }
    );
  });
};

async function loadEarthTextures() {
  try {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.textContent = 'Loading Earth textures...';
    }

          const [earthDayTexture, earthNightTexture, earthNormalTexture, cloudTexture] = await Promise.all([
        loadTexture('./earth-day.jpg'),
        loadTexture('./earth-night.jpg'),
        loadTexture('./earth-normal.jpg'),
        loadTexture('./earth-clouds.png')
      ]);

    earthMaterial.map = earthDayTexture;
    earthMaterial.emissiveMap = earthNightTexture;
    earthMaterial.emissive = new THREE.Color(0xffffff);
    earthMaterial.emissiveIntensity = 0.4;
    earthMaterial.normalMap = earthNormalTexture;
    earthMaterial.normalScale = new THREE.Vector2(0.6, 0.6);
    earthMaterial.needsUpdate = true;

    const cloudGeometry = new THREE.SphereGeometry(1.02, 128, 128);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earth.add(clouds);


    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Failed to load textures:', error);
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="text-align: center; color: white; font-family: Arial, sans-serif;">
          <h3>⚠️ Loading Error</h3>
          <p>Failed to load Earth textures.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 100);
});

let lastFrameTime = 0;
function animate(currentTime) {
  requestAnimationFrame(animate);

  // FPS control
  const deltaTime = currentTime - lastFrameTime;
  if (deltaTime < (1000 / MAX_FPS)) return;
  
  lastFrameTime = currentTime;

  if (controls) {
    controls.update();
  }

  earth.rotation.y += 0.00015 * (deltaTime / 16.67); 

  stars.rotation.y += 0.000008 * (deltaTime / 16.67);

  frameCount++;
  if (currentTime - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;
    
    if (import.meta.env?.DEV) {
      console.log(`FPS: ${fps}`);
    }
  }

  renderer.render(scene, camera);
}

async function init() {
  try {
    await loadEarthTextures();
    animate(performance.now());
  } catch (error) {
    console.error('Initialization failed:', error);
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="text-align: center; color: white; font-family: Arial, sans-serif;">
          <h3>❌ Initialization Failed</h3>
          <p>Please check your browser supports WebGL and try again.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
