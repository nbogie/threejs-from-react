import { useRef, useEffect, useState } from 'react';
import * as THREE from "three";
import { Material, Mesh, ShaderMaterial } from 'three';
import { createMetaballShaderMaterial, updateMetaballMaterial } from './metaballShader';

// Modified from Will Bamford's (class-component based) codepen: https://codepen.io/WebSeed/details/MEBoRq

// Note: React-three-fiber is likely a better bet for bigger works. 

interface Controls {
    start: () => void;
    stop: () => void;
    sliderVal: number;

}
function ThreeVis() {

    const mountRef = useRef<HTMLDivElement>(null!);
    const controlsRef = useRef<Controls>(null!);

    const [isAnimating, setAnimating] = useState(true);
    const [sliderVal, setSliderVal] = useState(0.2);

    useEffect(() => setup3dSceneAndReturnTeardownFn(mountRef, controlsRef), []);

    useEffect(() => {
        if (isAnimating) {
            controlsRef.current.start();
        } else {
            controlsRef.current.stop();
        }
    }, [isAnimating]);

    useEffect(() => {
        controlsRef.current.sliderVal = sliderVal;
    }, [sliderVal]);

    return (
        <div className="threeVis" ref={mountRef}>
            <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={sliderVal}
                onChange={(event) => setSliderVal(parseFloat(event.target.value))}
                className="slider"
                id="myRange"
            />
            <button onClick={() => setAnimating(!isAnimating)}>{isAnimating ? 'stop' : 'go'}</button>
        </div>
    );
};
export default ThreeVis;

function setup3dSceneAndReturnTeardownFn(mountRef: React.RefObject<HTMLDivElement>, controlsRef: React.MutableRefObject<Controls>) {
    if (!mountRef.current) {
        console.error("mountRef.current is null!  can't set up!");
        return;
    }
    let width = mountRef.current.clientWidth;
    let height = mountRef.current.clientHeight;
    let frameId: number | null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor("#000000");
    renderer.setSize(width, height);

    const light = new THREE.DirectionalLight(0xffdddd, 1);
    light.position.set(3, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);


    //make a thing
    let myShape: Mesh;
    {
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            flatShading: true,
            color: 0x0033ff
        });
        myShape = new THREE.Mesh(geometry, material);
        // myShape.position.x = -0.5;
        scene.add(myShape);
    }

    let { myCube, metaballSimulation } = createMyShadedCube();
    scene.add(myCube);

    const renderScene = () => {
        renderer.render(scene, camera);
    };

    const handleResize = () => {
        if (!mountRef.current) {
            console.error("mountRef.current is null!  can't handleResize!");
            return;
        }

        width = mountRef.current.clientWidth;
        height = mountRef.current.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderScene();
    };

    const animate = () => {
        myShape.rotation.y += controlsRef.current.sliderVal / 70;
        myCube.rotation.y += controlsRef.current.sliderVal / 50;
        updateMetaballMaterial(myCube.material as ShaderMaterial, metaballSimulation, 0.01);
        renderScene();
        frameId = window.requestAnimationFrame(animate);
    };

    const start = () => {
        if (!frameId) {
            frameId = requestAnimationFrame(animate);
        }
    };

    const stop = () => {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
        }
        frameId = null;
    };

    mountRef.current.appendChild(renderer.domElement);
    window.addEventListener("resize", handleResize);
    start();

    controlsRef.current = { start, stop, sliderVal: 0 };

    function tearDown() {

        stop();
        window.removeEventListener("resize", handleResize);
        if (mountRef.current) mountRef.current.removeChild(renderer.domElement);

        scene.remove(myShape);
        myShape.geometry.dispose();
        (myShape.material as Material).dispose();

        scene.remove(myCube);
        myCube.geometry.dispose();
        (myCube.material as Material).dispose();
    }

    return tearDown;
}

function createMyShadedCube() {
    const metaballData = createMetaballShaderMaterial();
    const mat = metaballData.mat;
    const metaballSimulation = metaballData.simulation;
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const myCube = new THREE.Mesh(geometry, mat);
    myCube.position.x = 0;
    return {
        myCube, metaballSimulation
    }
}