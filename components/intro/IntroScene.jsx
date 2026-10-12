"use client";

import { Float, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Baseball from "./Baseball";
import Shatter from "./Shatter";
import Stadium from "./Stadium";

// Timeline, in seconds after launch.
const CONTACT = 0.16; // barrel meets ball
const FOLLOW_THROUGH = 0.35;
const FLIGHT = 0.9;
const IMPACT = CONTACT + FLIGHT;
const ZOOM_DELAY = 0.1; // camera starts rushing through the hole
const ZOOM = 1.2;
const COMPLETE = IMPACT + 0.55; // hand off to the page's zoom-through transition

const BAT_REST = { yaw: -2.1, tilt: 0.7 };
const BAT_FINISH = { yaw: 1.7, tilt: 0.5 };
const BALL_OFFSET = [1.2, 1.12, 0]; // ball on the tee, relative to the batter
const LOOK_AT = new THREE.Vector3(0, 1.6, 0);
const BASE_FOV = 50;

// Button face and the navy frame behind it. Module-level so the shards stay stable.
const FACE = { width: 3.2, height: 0.9, depth: 0.35 };
const FRAME = [3.5, 1.15, 0.3];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = THREE.MathUtils.lerp;
const easeInQuad = (p) => p * p;
const easeOutCubic = (p) => 1 - (1 - p) ** 3;
const easeInCubic = (p) => p * p * p;

function useLayout() {
  const aspect = useThree((s) => s.size.width / s.size.height);
  return useMemo(() => {
    const narrow = aspect < 1;
    return {
      cameraZ: aspect >= 1.2 ? 7.5 : Math.min(15, (7.5 * 1.2) / aspect),
      batter: narrow ? [-2.2, 0, 2] : [-3.4, 0, 2],
      button: [0, narrow ? 2.5 : 1.9, 0],
    };
  }, [aspect]);
}

function CameraRig({ shake, zoom, focus, cameraZ }) {
  const camera = useThree((s) => s.camera);
  const cameraRef = useRef(camera);
  const base = useRef(new THREE.Vector3(0, 1.8, cameraZ));
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ pointer, clock }, delta) => {
    const cam = cameraRef.current;
    const t = clock.elapsedTime;
    // Gentle pointer parallax, smoothed.
    base.current.x = lerp(base.current.x, pointer.x * 0.4, 0.04);
    base.current.y = lerp(base.current.y, 1.8 + pointer.y * 0.2, 0.04);
    base.current.z = cameraZ;

    // Zoom: rush from the resting spot through where the button was, widening the FOV for speed.
    const z = easeInCubic(zoom.current);
    const s = shake.current;
    cam.position.set(
      lerp(base.current.x, focus.x, z) + Math.sin(t * 83) * 0.28 * s * s,
      lerp(base.current.y, focus.y, z) + Math.cos(t * 71) * 0.2 * s * s,
      lerp(base.current.z, focus.z + 0.3, z),
    );
    cam.lookAt(lookAt.copy(LOOK_AT).lerp(focus, z));
    cam.fov = BASE_FOV + 30 * z;
    cam.updateProjectionMatrix();
    shake.current = Math.max(0, s - delta * 1.6);
  });

  return null;
}

function Scene({ launched, onLaunch, onComplete }) {
  const layout = useLayout();
  const batYaw = useRef();
  const batTilt = useRef();
  const ball = useRef();
  const button = useRef();
  const buttonMaterial = useRef();
  const flashLight = useRef();
  const shatter = useRef();
  const shake = useRef(0);
  const zoom = useRef(0);
  const focus = useMemo(() => new THREE.Vector3(), []);
  const [hovered, setHovered] = useState(false);

  const start = useRef(null);
  const events = useRef({ contact: false, impact: false, complete: false });
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()),
    [],
  );
  const ballHome = useMemo(
    () => new THREE.Vector3(...layout.batter).add(new THREE.Vector3(...BALL_OFFSET)),
    [layout],
  );

  useEffect(() => {
    document.body.style.cursor = hovered && !launched ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, launched]);

  // Ball is the target point on the button's front face, wherever Float has moved it.
  function aimAtButton(target) {
    button.current.getWorldPosition(target);
    target.z += 0.2;
  }

  useFrame(({ clock }, delta) => {
    const now = clock.elapsedTime;
    const mat = buttonMaterial.current;

    if (!launched) {
      batYaw.current.rotation.y = BAT_REST.yaw + Math.sin(now * 2.2) * 0.06;
      batTilt.current.rotation.z = BAT_REST.tilt;
      ball.current.position.copy(ballHome);
      const scale = lerp(button.current.scale.x, hovered ? 1.07 : 1, 0.15);
      button.current.scale.setScalar(scale);
      mat.emissiveIntensity = lerp(mat.emissiveIntensity, hovered ? 0.8 : 0.35, 0.15);
      return;
    }

    if (start.current === null) start.current = now;
    const t = now - start.current;
    const ev = events.current;

    // 1. Swing: wind-up accelerates into contact, then eases through the follow-through.
    if (t < CONTACT) {
      const p = easeInQuad(t / CONTACT);
      batYaw.current.rotation.y = lerp(BAT_REST.yaw, 0, p);
      batTilt.current.rotation.z = lerp(BAT_REST.tilt, 0, p);
    } else {
      const p = easeOutCubic(clamp01((t - CONTACT) / FOLLOW_THROUGH));
      batYaw.current.rotation.y = lerp(0, BAT_FINISH.yaw, p);
      batTilt.current.rotation.z = lerp(0, BAT_FINISH.tilt, p);
    }

    // 2. Flight along a parabolic Bézier arc into the button.
    if (t >= CONTACT && !ev.contact) {
      ev.contact = true;
      curve.v0.copy(ballHome);
      aimAtButton(curve.v2);
      curve.v1.copy(curve.v0).lerp(curve.v2, 0.5);
      curve.v1.y += 4.5;
      shake.current = 0.35;
    }
    if (ev.contact && !ev.impact) {
      aimAtButton(curve.v2);
      curve.getPoint(clamp01((t - CONTACT) / FLIGHT), ball.current.position);
      ball.current.rotation.x += delta * 30;
      ball.current.rotation.y += delta * 12;
    }

    // 3. Impact: the button shatters, the camera shakes, then zooms through the hole.
    if (t >= IMPACT && !ev.impact) {
      ev.impact = true;
      ball.current.visible = false;
      button.current.getWorldPosition(focus);
      shatter.current.fire(button.current, curve.v2.clone());
      button.current.visible = false;
      shake.current = 1;
    }
    if (ev.impact) {
      flashLight.current.intensity = 60 * Math.max(0, 1 - (t - IMPACT) / 0.4);
      zoom.current = clamp01((t - IMPACT - ZOOM_DELAY) / ZOOM);
    }

    if (t >= COMPLETE && !ev.complete) {
      ev.complete = true;
      onComplete();
    }
  });

  return (
    <>
      <color attach="background" args={["#05070d"]} />
      <fog attach="fog" args={["#05070d", 18, 62]} />

      <ambientLight intensity={0.25} color="#6b7da8" />
      <hemisphereLight args={["#1b2a4a", "#0b140d", 0.5]} />
      <spotLight position={[-14, 18, -26]} angle={0.5} penumbra={0.8} intensity={2.2} decay={0} color="#fff2d0" />
      <spotLight position={[14, 18, -26]} angle={0.5} penumbra={0.8} intensity={2.2} decay={0} color="#fff2d0" />
      <spotLight
        position={[-2, 9, 10]}
        angle={0.45}
        penumbra={0.7}
        intensity={2.5}
        decay={0}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 2.2, -2]} intensity={8} distance={8} color="#ed771f" />

      <CameraRig shake={shake} zoom={zoom} focus={focus} cameraZ={layout.cameraZ} />
      <Stadium />

      {/* Batter placeholder: bat on a pivot at the handle, ball on a tee */}
      <group position={layout.batter}>
        <mesh position={[BALL_OFFSET[0], 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.05, 1, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[BALL_OFFSET[0], 0.02, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.04, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <group ref={batYaw} position-y={BALL_OFFSET[1]} rotation-y={BAT_REST.yaw}>
          <group ref={batTilt} rotation-z={BAT_REST.tilt}>
            <mesh rotation-z={-Math.PI / 2} position-x={0.75} castShadow>
              <cylinderGeometry args={[0.075, 0.032, 1.5, 24]} />
              <meshStandardMaterial color="#c8a165" roughness={0.45} />
            </mesh>
            <mesh rotation-z={-Math.PI / 2} position-x={0.2}>
              <cylinderGeometry args={[0.037, 0.035, 0.4, 16]} />
              <meshStandardMaterial color="#0c2340" roughness={0.9} />
            </mesh>
            <mesh rotation-z={-Math.PI / 2}>
              <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
              <meshStandardMaterial color="#0c2340" roughness={0.9} />
            </mesh>
          </group>
        </group>
      </group>

      <group ref={ball}>
        <Baseball radius={0.12} />
      </group>

      {/* START DRAFT target button */}
      <Float speed={2} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
        <group position={layout.button}>
          <group ref={button}>
            <mesh position-z={-0.06}>
              <boxGeometry args={FRAME} />
              <meshStandardMaterial color="#0c2340" roughness={0.5} />
            </mesh>
            <mesh
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              <boxGeometry args={[FACE.width, FACE.height, FACE.depth]} />
              <meshStandardMaterial
                ref={buttonMaterial}
                color="#ed771f"
                emissive="#ed771f"
                emissiveIntensity={0.35}
                roughness={0.35}
                metalness={0.15}
              />
            </mesh>
            <Suspense fallback={null}>
              <Text
                position-z={0.18}
                fontSize={0.36}
                letterSpacing={0.08}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.008}
                outlineColor="#0c2340"
              >
                START DRAFT
              </Text>
            </Suspense>
          </group>
          <pointLight ref={flashLight} position-z={1} intensity={0} distance={14} color="#ffd86b" />
        </group>
      </Float>

      <Shatter ref={shatter} {...FACE} frame={FRAME} />
    </>
  );
}

export default function IntroScene(props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.8, 7.5], fov: 50, near: 0.1, far: 400 }}
      gl={{ antialias: true }}
      aria-label="3D stadium intro"
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
