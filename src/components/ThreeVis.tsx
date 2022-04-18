import { useRef, useEffect, useState } from 'react';
import * as THREE from "three";

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
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        flatShading: true,
        color: 0x0033ff
    });
    const myShape = new THREE.Mesh(geometry, material);

    scene.add(myShape);

    // const helper = new THREE.DirectionalLightHelper(light, 5);
    // scene.add(helper);




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
        geometry.dispose();
        material.dispose();
    }

    return tearDown;
}