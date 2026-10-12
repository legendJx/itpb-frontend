import { Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";

// Field geometry, in scene units. Home plate sits just in front of the camera
// and the diamond opens up toward -z.
const HOME = [0, 0, 3];
const HALF_DIAGONAL = 6.36;
const CENTER_Z = HOME[2] - HALF_DIAGONAL;
const BASES = [
  [HALF_DIAGONAL, CENTER_Z],
  [0, CENTER_Z - HALF_DIAGONAL],
  [-HALF_DIAGONAL, CENTER_Z],
];

// Outfield arc: cylinder theta is measured from +z, so π points at deep center.
const ARC_START = (2 * Math.PI) / 3;
const ARC_LENGTH = (2 * Math.PI) / 3;
const TOWER_ANGLES = [-0.9, -0.35, 0.35, 0.9];

function FlatPlane({ size, color, position, rotation = 0, y = 0.01 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, rotation]} position={[position[0], y, position[1]]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function FoulLine({ direction }) {
  const length = 40;
  const angle = -direction * (Math.PI / 4);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, angle]}
      position={[
        HOME[0] + Math.sin(direction * (Math.PI / 4)) * (length / 2),
        0.03,
        HOME[2] - Math.cos(Math.PI / 4) * (length / 2),
      ]}
    >
      <planeGeometry args={[0.07, length]} />
      <meshBasicMaterial color="#f7f5ef" />
    </mesh>
  );
}

function LightTower({ angle }) {
  const radius = 36;
  const x = HOME[0] + Math.sin(Math.PI + angle) * radius;
  const z = HOME[2] + Math.cos(Math.PI + angle) * radius;
  return (
    <group position={[x, 0, z]} rotation-y={angle}>
      <mesh position-y={9}>
        <cylinderGeometry args={[0.18, 0.3, 18, 8]} />
        <meshStandardMaterial color="#0b1424" />
      </mesh>
      <mesh position-y={18.6}>
        <boxGeometry args={[4.2, 1.8, 0.3]} />
        <meshStandardMaterial color="#fff2d0" emissive="#fff2d0" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Stadium() {
  return (
    <group>
      {/* Outfield grass with mowing stripes */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color="#123d1f" roughness={1} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <FlatPlane key={i} size={[2.4, 70]} color="#174a27" position={[(i - 3) * 4.8, -15]} y={0.004} />
      ))}

      {/* Infield: dirt square, grass cutout, mound, bases */}
      <FlatPlane size={[11, 11]} color="#6b4428" position={[0, CENTER_Z]} rotation={Math.PI / 4} y={0.008} />
      <FlatPlane size={[7.6, 7.6]} color="#15451f" position={[0, CENTER_Z]} rotation={Math.PI / 4} y={0.012} />
      <mesh position={[0, 0.06, CENTER_Z]} receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.12, 32]} />
        <meshStandardMaterial color="#6b4428" roughness={1} />
      </mesh>
      {BASES.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.05, z]} rotation-y={Math.PI / 4}>
          <boxGeometry args={[0.38, 0.08, 0.38]} />
          <meshStandardMaterial color="#f7f5ef" />
        </mesh>
      ))}
      <mesh position={[HOME[0], 0.03, HOME[2]]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 5]} />
        <meshStandardMaterial color="#f7f5ef" />
      </mesh>
      <FoulLine direction={1} />
      <FoulLine direction={-1} />

      {/* Outfield wall with a gold cap, sloped stands behind it */}
      <mesh position={[HOME[0], 1.5, HOME[2]]}>
        <cylinderGeometry args={[30, 30, 3, 64, 1, true, ARC_START, ARC_LENGTH]} />
        <meshStandardMaterial color="#0c2340" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position={[HOME[0], 3.05, HOME[2]]}>
        <cylinderGeometry args={[29.9, 29.9, 0.12, 64, 1, true, ARC_START, ARC_LENGTH]} />
        <meshStandardMaterial color="#ffb627" emissive="#ffb627" emissiveIntensity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[HOME[0], 7.5, HOME[2]]}>
        <cylinderGeometry args={[40, 31, 9, 64, 1, true, ARC_START, ARC_LENGTH]} />
        <meshStandardMaterial color="#070d18" side={THREE.DoubleSide} roughness={1} />
      </mesh>

      {TOWER_ANGLES.map((angle) => (
        <LightTower key={angle} angle={angle} />
      ))}

      {/* Crowd camera flashes and night sky */}
      <Sparkles count={160} scale={[60, 7, 6]} position={[0, 7, -30]} size={3} speed={0.25} color="#fff4d6" />
      <Stars radius={120} depth={40} count={2500} factor={4} saturation={0} fade speed={0.4} />
    </group>
  );
}
