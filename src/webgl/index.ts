import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import DeltaTime from "../DeltaTime";
import { ExternalsPlugin } from "webpack";
import Screen from "./screen/";
import Stats from "stats.js";
import { loadAssists } from "./loader";
import { Vector3 } from "three";

function valMap(x: number, from: [number, number], to: [number, number]) {
  const y = ((x - from[0]) / (from[1] - from[0])) * (to[1] - to[0]) + to[0];

  if (to[0] < to[1]) {
    if (y < to[0]) return to[0];
    if (y > to[1]) return to[1];
  } else {
    if (y > to[0]) return to[0];
    if (y < to[1]) return to[1];
  }

  return y;
}

let scroll = 0;
window.addEventListener("scroll", (ev) => {
  scroll = window.scrollY / document.documentElement.clientHeight;
  // console.log(window.scrollY / document.documentElement.clientHeight);
});


export default function WebGL() {
  loadAssists((assists) => {
    var stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(stats.dom);

    // Canvas
    const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
    if (!canvas) console.error("no canvas");
    /**
     * Sizes
     */
    const widthOffset = 0.5;
    const sizes = {
      width: document.documentElement.clientWidth,
      // width: window.innerWidth / (widthOffset + 1),
      height: window.innerHeight,
      portraitOffset: valMap(
        window.innerHeight / document.documentElement.clientWidth,
        [0.75, 1.75],
        [0, 2]
      ),
    };

    // const sideBar = {
    //   left: document.querySelector("div#left") as HTMLDivElement,
    //   right: document.querySelector("div#right") as HTMLDivElement,
    // };

    // Scene
    const scene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);
    scene.background = new THREE.Color(0xf6d4b1);

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(
      50,
      sizes.width / sizes.height,
      0.1,
      100
    );
    camera.position.set(0, 0, -2.5);
    // camera.position.set(0, -1, -5.5);
    camera.rotation.set(-Math.PI, 0, Math.PI);
    scene.add(camera);

    // Controls
    // const controls = new OrbitControls(camera, canvas);

    const controlProps = {
      computerHeight: 1.5,
      computerAngle: Math.PI * 0.2,
      computerHorizontal: 0.5,

      minAzimuthAngleOffest: -Math.PI * 0.3,
      maxAzimuthAngleOffest: Math.PI * 0.3,

      minPolarAngleOffest: -Math.PI * 0.3,
      maxPolarAngleOffest: 0,
    };

    // controls.enabled = false;
    // controls.enableDamping = true;
    // controls.enablePan = false;
    // controls.enableZoom = false;

    // controls.maxDistance = 10;
    // controls.minDistance = 2.5;

    // controls.getDistance()

    // controls.minAzimuthAngle = Math.PI + controlProps.minAzimuthAngleOffest;
    // controls.maxAzimuthAngle = Math.PI + controlProps.maxAzimuthAngleOffest;

    // controls.minPolarAngle = Math.PI * 0.5 + controlProps.minPolarAngleOffest;
    // controls.maxPolarAngle = Math.PI * 0.5 + controlProps.maxPolarAngleOffest;

    const computerParallax = { x: 0, y: 0, old: { x: 0, y: 0 } };
    document.addEventListener("mousemove", (event) => {
      const mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      const mouseY = (event.clientY / window.innerHeight - 0.5) * -2;

      computerParallax.old.x = computerParallax.x;
      computerParallax.old.y = computerParallax.y;

      computerParallax.x = mouseY * (Math.PI / 32);
      computerParallax.y = mouseX * (Math.PI / 32);
    });

    /**
     * Renderer
     */

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.render(sceneRTT, cameraRTT);

    function updateCanvasSize(width: number, height: number) {
      // Update camera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    window.addEventListener("resize", () => {
      // Update sizes

      sizes.width = document.documentElement.clientWidth;
      // sizes.width = window.innerWidth / (widthOffset + 1);
      sizes.height = window.innerHeight;
      updateCanvasSize(sizes.width, sizes.height);
      sizes.portraitOffset = valMap(
        sizes.height / sizes.width,
        [0.75, 1.75],
        [0, 2]
      );
      console.log(sizes.portraitOffset);
    });

    const screen = Screen(assists, renderer);

    const planelikeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const plane = new THREE.Mesh(
      planelikeGeometry,
      // texture
      new THREE.MeshBasicMaterial({ color: "blue" })
    );
    plane.scale.x = 1.33;
    // scene.add(plane);

    // Materials
    // const computerMaterial = new THREE.MeshStandardMaterial({ map: assists.bakeTexture});
    // computerMaterial.envMap = assists.environmentMapTexture
    // computerMaterial.roughnessMap = assists.glossMap
    const computerMaterial = new THREE.MeshBasicMaterial({
      map: assists.bakeTexture,
    });

    /**
     * Models
     */
    const computerGroup = new THREE.Group();

    assists.screenMesh.material = screen.screenRenderEngine.material;
    computerGroup.add(assists.screenMesh);

    assists.computerMesh.material = computerMaterial;
    computerGroup.add(assists.computerMesh);

    assists.crtMesh.material = computerMaterial;
    computerGroup.add(assists.crtMesh);

    assists.keyboardMesh.material = computerMaterial;
    computerGroup.add(assists.keyboardMesh);

    // assists.shadowPlaneMesh.material = new THREE.MeshBasicMaterial({ map: assists.bakeFloorTexture, blending: THREE.MultiplyBlending, transparent: true });
    assists.shadowPlaneMesh.material = new THREE.MeshBasicMaterial({
      map: assists.bakeFloorTexture,
    });
    computerGroup.add(assists.shadowPlaneMesh);

    computerGroup.position.x = controlProps.computerHorizontal;
    computerGroup.position.y = controlProps.computerHeight;
    computerGroup.rotation.y = controlProps.computerAngle;
    scene.add(computerGroup);

    /**
     * Animate
     */

    const clock = new THREE.Clock();
    const tick = () => {
      stats.begin();

      const deltaTime = DeltaTime();
      const elapsedTime = clock.getElapsedTime();

      // Update controls

      // const zoomFac =
      //   (controls.getDistance() - controls.minDistance) /
      //   (controls.maxDistance - controls.minDistance);

      const zoomFac = valMap(scroll, [0, 1], [0, 1]);

      camera.position.z = valMap(
        scroll,
        [0, 1],
        [-2.5 - sizes.portraitOffset, -10 - sizes.portraitOffset]
      );

      // console.log(sizes.width/sizes.height);

      // camera.position.z = -2.5 + ;
      // computerGroup.position.z = 7.5 * zoomFac;
      computerGroup.position.x = controlProps.computerHorizontal * zoomFac;
      computerGroup.position.y = valMap(
        scroll,
        [0, 1],
        [0, controlProps.computerHeight]
      );

      computerGroup.rotation.y = controlProps.computerAngle * zoomFac;

      // computerGroup.rotation.y = computerParallax.y * 0.05 + computerGroup.rotation.y * 0.95;

      // computerGroup.rotation.y = computerParallax.y * 0.05 + computerGroup.rotation.y * 0.85;

      camera.position.x = computerParallax.y * 0.10 + camera.position.x * 0.95;
      camera.position.y = computerParallax.x * 0.10 + camera.position.y * 0.95;

      // -Math.PI, 0, Math.PI
      camera.lookAt(new Vector3(0,0,0))

      // camera.lookAt(computerGroup);

      // computerGroup.rotation.y =
      //   (computerParallax.y + controlProps.computerAngle * zoomFac) * 0.05 +
      //   (computerParallax.old.y * 0.05 + controlProps.computerAngle * zoomFac) * 0.95;

      // computerGroup.rotation.y = computerParallax.y * 0.05 + computerParallax.old.y * 0.05 +  controlProps.computerAngle * zoomFac

      // (computerParallax.y + controlProps.computerAngle * zoomFac) * 0.05 +
      // (computerParallax.old.y * 0.05 + controlProps.computerAngle * zoomFac) * 0.95;

      // computerGroup.rotation.y =
      //   (screenMeshTargetRotation.y + controlProps.computerAngle * zoomFac) * 0.05 + (controlProps.computerAngle * zoomFac) * 0.95;

      // computerGroup.rotation.y =
      // screenMeshTargetRotation.y * 0.05 + computerGroup.rotation.y * 0.95;

      // canvas.style.left = `-${50*valMap(scroll, [1, 2], [0, 1])}%`

      canvas.style.opacity = `${valMap(scroll, [1.25, 1.75], [1, 0])}`;

      // controls.minAzimuthAngle =
      //   Math.PI + controlProps.minAzimuthAngleOffest * zoomFac - 0.1;
      // controls.maxAzimuthAngle =
      //   Math.PI + controlProps.maxAzimuthAngleOffest * zoomFac + 0.1;

      // controls.minPolarAngle =
      //   Math.PI * 0.5 + controlProps.minPolarAngleOffest * zoomFac - 0.1;
      // controls.maxPolarAngle =
      //   Math.PI * 0.5 + controlProps.maxPolarAngleOffest * zoomFac + 0.1;

      if (sizes.portraitOffset > 0)
        computerGroup.rotation.z = valMap(scroll, [0, 1], [-Math.PI / 2, 0]);
      else computerGroup.rotation.z = 0;

      if (assists.crtMesh.morphTargetInfluences) {
        // if (sizes.portraitOffset === 0)
        assists.crtMesh.morphTargetInfluences[0] = valMap(
          zoomFac,
          [0, 0.1],
          [0.5, 0]
        );
        // else assists.crtMesh.morphTargetInfluences[0] = 0;
      }

      // sideBar.left.style.width = `${zoomFac > 0 ? '0px' : '100px'}`;
      // sideBar.right.style.width = `${zoomFac > 0 ? '0px' : '100px'}`;

      // sizes.width = window.innerWidth / ((widthOffset * zoomFac) + 1);
      // updateCanvasSize(sizes.width, sizes.height);

      // controls.update();
      // if (assists.screenMesh) {

      // }

      screen.tick(deltaTime, elapsedTime);

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      stats.end();
      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    };

    tick();
  });
}
