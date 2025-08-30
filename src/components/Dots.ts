// src/components/Dots.ts
import * as THREE from "three";
import userData from "../data/globeData";

export function addUserDots(scene: THREE.Scene) {  // Ensure the function is correctly exported
  const texture = new THREE.TextureLoader().load("/glow.png");

  userData.forEach((user) => {
    const { lat, lng } = user;

    const radius = 1.01; // slightly above the surface
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xff0066,
      transparent: true,
      opacity: 0.8,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.05, 0.05, 0.05);
    sprite.position.set(x, y, z);
    scene.add(sprite);
  });
}
