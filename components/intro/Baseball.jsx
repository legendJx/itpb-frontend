import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const STITCHES = 108; // a regulation ball has 108 double stitches
const LOBE = 0.5; // how far the seam's lobes stay from the poles, in radians

// The classic baseball/tennis-ball seam: one loop that swings between the
// poles twice as it goes around the equator, t ∈ [0, 4π).
function seamPoint(t, radius, target = new THREE.Vector3()) {
  const theta = Math.PI / 2 - (Math.PI / 2 - LOBE) * Math.cos(t);
  const phi = t / 2 + LOBE * Math.sin(2 * t);
  return target.set(
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.cos(theta),
    radius * Math.sin(theta) * Math.sin(phi),
  );
}

function segment(from, to, thickness) {
  const length = from.distanceTo(to);
  const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 5, 1);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    to.clone().sub(from).normalize(),
  );
  const matrix = new THREE.Matrix4().compose(
    from.clone().add(to).multiplyScalar(0.5),
    quaternion,
    new THREE.Vector3(1, 1, 1),
  );
  return geometry.applyMatrix4(matrix);
}

function buildSeam(radius) {
  const points = [];
  for (let i = 0; i < 256; i++) points.push(seamPoint((i / 256) * 4 * Math.PI, radius * 1.002));
  const groove = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 256, radius * 0.018, 4, true);

  // Each stitch is a "V" of red thread crossing the seam.
  const parts = [];
  const p = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const width = radius * 0.11;
  const lean = radius * 0.06;
  const thickness = radius * 0.016;
  for (let i = 0; i < STITCHES; i++) {
    const t = (i / STITCHES) * 4 * Math.PI;
    seamPoint(t, radius * 1.01, p);
    seamPoint(t + 0.001, radius * 1.01, ahead);
    const tangent = ahead.sub(p).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, p).normalize();
    const tip = p.clone().addScaledVector(tangent, lean);
    parts.push(segment(p.clone().addScaledVector(side, width), tip, thickness));
    parts.push(segment(p.clone().addScaledVector(side, -width), tip, thickness));
  }
  return { groove, stitches: mergeGeometries(parts) };
}

export default function Baseball({ radius = 0.12 }) {
  const { groove, stitches } = useMemo(() => buildSeam(radius), [radius]);

  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial color="#f3eee2" roughness={0.75} />
      </mesh>
      <mesh geometry={groove}>
        <meshStandardMaterial color="#d8cfbd" roughness={0.9} />
      </mesh>
      <mesh geometry={stitches}>
        <meshStandardMaterial color="#c8312b" roughness={0.6} />
      </mesh>
    </group>
  );
}
