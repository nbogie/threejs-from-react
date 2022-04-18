import * as THREE from "three";

export function createMyShaderMaterial(): THREE.ShaderMaterial {

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    void main () {
      gl_FragColor = vec4(vUv.x, 1., 0., 1.);
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      // your unifroms
    },
    vertexShader,
    fragmentShader
  });
  return material;
}
