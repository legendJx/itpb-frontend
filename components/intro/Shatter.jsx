import { useFrame } from "@react-three/fiber";
import { useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const COLS = 10;
const ROWS = 3;
const FRAME_SHARDS = 16;
const LIFETIME = 2.5;
const GRAVITY = 7;

const ORANGE = new THREE.Color("#ed771f");
const NAVY = new THREE.Color("#0c2340");
const WHITE = new THREE.Color("#ffffff");

const rand = (min, max) => min + Math.random() * (max - min);

// Splits the face into a jittered grid of chunks, plus a few from the navy frame.
function makeShards({ width, height, depth, frame }) {
  const shards = [];
  const cw = width / COLS;
  const ch = height / ROWS;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // The middle row carries the lettering, so some of it breaks off white.
      const lettering = r === 1 && c > 0 && c < COLS - 1 && Math.random() < 0.45;
      shards.push({
        local: new THREE.Vector3(
          -width / 2 + cw * (c + 0.5) + rand(-0.04, 0.04),
          -height / 2 + ch * (r + 0.5) + rand(-0.03, 0.03),
          0,
        ),
        size: new THREE.Vector3(cw * rand(0.9, 1.4), ch * rand(0.9, 1.4), depth * rand(0.5, 1)),
        color: lettering ? WHITE : ORANGE,
      });
    }
  }
  for (let i = 0; i < FRAME_SHARDS; i++) {
    const onLongEdge = i < FRAME_SHARDS * 0.75;
    const x = onLongEdge ? rand(-frame[0] / 2, frame[0] / 2) : Math.sign(rand(-1, 1)) * frame[0] / 2;
    const y = onLongEdge ? Math.sign(rand(-1, 1)) * frame[1] / 2 : rand(-frame[1] / 2, frame[1] / 2);
    shards.push({
      local: new THREE.Vector3(x, y, -0.06),
      size: new THREE.Vector3(rand(0.15, 0.35), rand(0.1, 0.2), frame[2]),
      color: NAVY,
    });
  }
  return shards.map((s) => ({
    ...s,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    spin: new THREE.Euler(),
  }));
}

// Breaks the START DRAFT button into flying chunks.
// Call ref.current.fire(buttonObject, hitPoint) to shatter it.
export default function Shatter({ ref, width, height, depth, frame }) {
  const mesh = useRef();
  const age = useRef(-1);
  const shards = useMemo(
    () => makeShards({ width, height, depth, frame }),
    [width, height, depth, frame],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const step = useMemo(() => new THREE.Quaternion(), []);

  useLayoutEffect(() => {
    shards.forEach((s, i) => mesh.current.setColorAt(i, s.color));
    mesh.current.instanceColor.needsUpdate = true;
  }, [shards]);

  useImperativeHandle(ref, () => ({
    fire(object, hitPoint) {
      object.updateWorldMatrix(true, false);
      const worldQuaternion = object.getWorldQuaternion(new THREE.Quaternion());
      const outward = new THREE.Vector3();
      for (const s of shards) {
        s.position.copy(s.local).applyMatrix4(object.matrixWorld);
        outward.subVectors(s.position, hitPoint).setZ(0);
        if (outward.lengthSq() < 1e-6) outward.set(rand(-1, 1), rand(-1, 1), 0);
        outward.normalize();
        // Blown outward from the hit, and forward past the camera.
        s.velocity
          .copy(outward)
          .multiplyScalar(rand(2, 6))
          .add(new THREE.Vector3(rand(-0.5, 0.5), rand(0.5, 2.5), rand(3, 10)));
        s.quaternion.copy(worldQuaternion);
        s.spin.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
      }
      mesh.current.visible = true;
      age.current = 0;
    },
  }));

  useFrame((_, delta) => {
    if (age.current < 0) return;
    const dt = Math.min(delta, 1 / 30);
    age.current += dt;

    shards.forEach((s, i) => {
      s.velocity.y -= GRAVITY * dt;
      s.position.addScaledVector(s.velocity, dt);
      step.setFromEuler(new THREE.Euler(s.spin.x * dt, s.spin.y * dt, s.spin.z * dt));
      s.quaternion.multiply(step);
      dummy.position.copy(s.position);
      dummy.quaternion.copy(s.quaternion);
      dummy.scale.copy(s.size);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;

    if (age.current > LIFETIME) {
      mesh.current.visible = false;
      age.current = -1;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, shards.length]} visible={false} frustumCulled={false}>
      <icosahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial roughness={0.35} metalness={0.15} flatShading />
    </instancedMesh>
  );
}
