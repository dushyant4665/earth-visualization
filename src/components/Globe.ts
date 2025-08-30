// src/components/Globe.ts
import * as THREE from 'three';
import GeoJsonGeometry from 'three-geojson-geometry';
import countries from '../data/countries.json';
import { addUserDots } from './Dots';

export function loadGlobe(scene: THREE.Scene) {
  const loader = new THREE.TextureLoader();

  // — 8K PBR Textures
  const colorMap = loader.load('/earth-8k.jpg');
  const normalMap = loader.load('/earth-normal-8k.jpg');
  const roughnessMap = loader.load('/earth-roughness-8k.jpg');
  const specularMap = loader.load('/earth-specular-8k.jpg');
  const displacementMap = loader.load('/earth-displacement-8k.jpg');
  const cloudMap = loader.load('/earth-clouds-8k.png');
  const nightMap = loader.load('/earth-night-8k.jpg');

  // Configure texture parameters
  [colorMap, normalMap, roughnessMap, specularMap].forEach(map => {
    map.anisotropy = 16;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
  });

  // 1) Earth Core
  const earthGeo = new THREE.SphereGeometry(1, 256, 256);
  const earthMat = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    metalnessMap: specularMap,
    displacementMap: displacementMap,
    displacementScale: 0.1,
    metalness: 0.4,
    roughness: 0.7,
    envMapIntensity: 2.5
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earthMesh);

  // 2) Ocean Specular Layer
  const oceanMat = new THREE.MeshPhongMaterial({
    specular: 0xffffff,
    shininess: 100,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const oceanMesh = new THREE.Mesh(earthGeo.clone(), oceanMat);
  scene.add(oceanMesh);

  // 3) Volumetric Clouds
  const cloudGeo = new THREE.SphereGeometry(1.01, 256, 256);
  const cloudMat = new THREE.MeshPhysicalMaterial({
    map: cloudMap,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.5,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  scene.add(cloudMesh);

  // 4) Atmospheric Scattering
  const atmosphereGeo = new THREE.SphereGeometry(1.05, 128, 128);
  const atmosphereMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  });
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  scene.add(atmosphere);

  // 5) Country Borders
  // @ts-ignore
  const bordersGeo = new GeoJsonGeometry((countries as any).features, 1.001);
  const bordersMat = new THREE.LineBasicMaterial({
    color: 0x303030,
    linewidth: 0.5,
    transparent: true,
    opacity: 0.8
  });
  scene.add(new THREE.LineSegments(bordersGeo, bordersMat));

  // 6) User Dots
  addUserDots(scene);

  // 7) Realistic Rotation with Axial Tilt
  const AXIAL_TILT = new THREE.Euler(0.4091, 0, 0);
  [earthMesh, cloudMesh, oceanMesh].forEach(mesh => mesh.rotation.copy(AXIAL_TILT));

  (function animate() {
    requestAnimationFrame(animate);
    const rotationSpeed = 0.0001;
    earthMesh.rotation.y += rotationSpeed;
    cloudMesh.rotation.y += rotationSpeed * 1.2;
    oceanMesh.rotation.y += rotationSpeed * 0.95;
  })();
}