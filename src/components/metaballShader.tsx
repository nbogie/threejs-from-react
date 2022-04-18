import * as THREE from "three";
import { ShaderMaterial, Vector2 } from "three";
interface Particle {
  pos: Vector2;
  vel: Vector2;
  size: number;
}
export interface Simulation {
  particles: Particle[];
}

export function createMetaballShaderMaterial(): { mat: THREE.ShaderMaterial, simulation: Simulation } {

  const simulation: Simulation = { particles: [] };
  for (let i = 0; i < 4; i++) {
    const obj: Particle = {
      pos: randomPosition(),
      vel: new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.01),
      size: Math.random() + 0.1
    }
    simulation.particles.push(obj);
  }

  console.log(simulation)
  function randomPosition() {
    return new THREE.Vector2(Math.random(), Math.random());
  }
  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    uniform float time;    
    uniform vec2 particles[ 4 ];

    void main () {
      vec4 c1Transparent = vec4(1., 0., 0., 0.);
      vec4 c2Main = vec4(0., 1., 0., 1.);

      float d1 = 1. / (distance(particles[0], vUv));
      float d2 = 1. / (distance(particles[1], vUv));
      float d3 = 1. / (distance(particles[2], vUv));
      float d4 = 1. / (distance(particles[3], vUv));
      float sum = (d1 + d2 + d3 + d4) / 20.;
      float v = smoothstep(0.72, 0.74, sum);
      vec4 final = mix(c1Transparent, c2Main, v);
      if (vUv.x < 0.01 || vUv.x > 0.99 || vUv.y < 0.01 || vUv.y > 0.99){
        gl_FragColor = c2Main;      
      } else {
        gl_FragColor = final;
      }
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
      particles: {
        value: simulation.particles.map(p => p.pos)
      }
    },
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader,
    fragmentShader
  });
  return { mat: material, simulation };
}


export function updateMetaballMaterial(mat: ShaderMaterial, simulation: Simulation, timeIncrement: number) {
  for (const particle of simulation.particles) {
    particle.pos.add(particle.vel);
    if (particle.pos.x >= 1 || particle.pos.x <= 0) {
      particle.vel.x *= -1;
    }
    if (particle.pos.y >= 1 || particle.pos.y <= 0) {
      particle.vel.y *= -1;
    }
  }

  mat.uniforms.time.value += timeIncrement;
  mat.uniforms.particles.value = simulation.particles.map(p => p.pos);
}