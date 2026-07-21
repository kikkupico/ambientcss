import React, { useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  CHAMFER_MM_PER_WIDTH,
  FILLET_MM_PER_WIDTH,
  LIGHT_DEFAULTS,
  edgeMm,
  elevationMm,
  thicknessMm
} from "../lib/ambSceneModel";
import { buildKnobGeometry, buildPlateGeometry } from "../lib/sceneGeometry";

/* ---------------------------------------------------------------------
   Layout: real proportions from ambSceneModel (mirroring the Blender rig
   at ambient3d/amb_model.py), scene units = mm. Geometries are built once
   at module scope since none of it depends on component state.
   --------------------------------------------------------------------- */

const PANEL = {
  width: 170,
  depth: 100,
  cornerRadius: 14,
  thickness: thicknessMm(2),
  edgeSize: edgeMm(1, CHAMFER_MM_PER_WIDTH, 2),
  edgeSegments: 1
};

const METER_HOLE = { width: 48, depth: 28, cornerRadius: 6, x: -52, z: 20 };
const METER_FLOOR = { width: 46, depth: 26, cornerRadius: 5, thickness: 1 };

// Height that "elevation 1" / "elevation 2" objects sit above the panel top.
const RAISED_1_Y = PANEL.thickness + elevationMm(1);
const RAISED_2_Y = PANEL.thickness + elevationMm(2);

const KNOB = { radius: 13, bodyHeight: 2, domeHeight: 6.5, x: -45, z: -8 };

const CHAMFER_BTN = {
  width: 42,
  depth: 24,
  cornerRadius: 6,
  thickness: thicknessMm(1),
  edge: edgeMm(1, CHAMFER_MM_PER_WIDTH, 1),
  edgeSegments: 1,
  x: 5,
  z: -18
};

const FILLET_BTN = {
  width: 38,
  depth: 22,
  cornerRadius: 8,
  thickness: thicknessMm(1),
  edge: edgeMm(1, FILLET_MM_PER_WIDTH, 1),
  edgeSegments: 10,
  x: 52,
  z: 12
};

const panelGeometry = buildPlateGeometry({ ...PANEL, hole: METER_HOLE });
const meterFloorGeometry = buildPlateGeometry({
  width: METER_FLOOR.width,
  depth: METER_FLOOR.depth,
  cornerRadius: METER_FLOOR.cornerRadius,
  thickness: METER_FLOOR.thickness,
  edgeSize: 0,
  edgeSegments: 1
});
const knobGeometry = buildKnobGeometry(KNOB.radius, KNOB.bodyHeight, KNOB.domeHeight);
const chamferBtnGeometry = buildPlateGeometry({
  width: CHAMFER_BTN.width,
  depth: CHAMFER_BTN.depth,
  cornerRadius: CHAMFER_BTN.cornerRadius,
  thickness: CHAMFER_BTN.thickness,
  edgeSize: CHAMFER_BTN.edge,
  edgeSegments: CHAMFER_BTN.edgeSegments
});
const filletBtnGeometry = buildPlateGeometry({
  width: FILLET_BTN.width,
  depth: FILLET_BTN.depth,
  cornerRadius: FILLET_BTN.cornerRadius,
  thickness: FILLET_BTN.thickness,
  edgeSize: FILLET_BTN.edge,
  edgeSegments: FILLET_BTN.edgeSegments
});

/* ---------------------------------------------------------------------
   Lighting: mirrors ambient3d/amb_params.py's key-light placement
   (key.location = (LIGHT_R * lx, -LIGHT_R * ly, LIGHT_Z)) so the sign of
   light-y matches the CSS: --amb-light-y: -1 means "from the top" in both
   the box-shadow math and here.
   --------------------------------------------------------------------- */

const LIGHT_DISTANCE = 90;
const LIGHT_DEPTH = 70;
const KEY_INTENSITY_SCALE = 3.2;
const FILL_INTENSITY_SCALE = 0.9;
const AMBIENT_FLOOR = 0.08;

interface SceneProps {
  lightX: number;
  lightY: number;
  keyIntensity: number;
  fillIntensity: number;
  exploded: boolean;
}

function SceneContents({ lightX, lightY, keyIntensity, fillIntensity, exploded }: SceneProps) {
  const raised1Ref = useRef<THREE.Group>(null);
  const raised2Ref = useRef<THREE.Group>(null);

  const lightWorldX = LIGHT_DISTANCE * lightX;
  const lightWorldY = -LIGHT_DISTANCE * lightY;

  useFrame(() => {
    const offset1 = exploded ? 16 : 0;
    const offset2 = exploded ? 40 : 0;
    if (raised1Ref.current) {
      raised1Ref.current.position.y = THREE.MathUtils.lerp(raised1Ref.current.position.y, offset1, 0.12);
    }
    if (raised2Ref.current) {
      raised2Ref.current.position.y = THREE.MathUtils.lerp(raised2Ref.current.position.y, offset2, 0.12);
    }
  });

  return (
    <>
      <ambientLight intensity={AMBIENT_FLOOR} />
      <hemisphereLight
        args={["#eef3ff", "#8b8f86", fillIntensity * FILL_INTENSITY_SCALE]}
      />
      <directionalLight
        position={[lightWorldX, lightWorldY, LIGHT_DEPTH]}
        intensity={keyIntensity * KEY_INTENSITY_SCALE}
        color="#fff8ef"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-near={10}
        shadow-camera-far={400}
        shadow-bias={-0.0015}
      />
      <mesh position={[lightWorldX * 0.42, lightWorldY * 0.42 + 30, LIGHT_DEPTH * 0.42]}>
        <sphereGeometry args={[2.2, 16, 16]} />
        <meshBasicMaterial color="#ffdca0" />
        <Html center distanceFactor={220} className="tdd-label tdd-label-light">
          Key Light
        </Html>
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#c9d0de" roughness={1} metalness={0} />
      </mesh>

      <mesh geometry={panelGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#eef1f6" roughness={0.85} metalness={0.04} />
      </mesh>

      <mesh
        geometry={meterFloorGeometry}
        position={[METER_HOLE.x, 0, METER_HOLE.z]}
        receiveShadow
      >
        <meshStandardMaterial color="#7b8494" roughness={0.9} metalness={0.02} />
        <Html
          position={[0, METER_FLOOR.thickness + 2, 0]}
          center
          distanceFactor={220}
          className="tdd-label"
        >
          elev 0 &middot; recessed
        </Html>
      </mesh>

      <group ref={raised1Ref}>
        <mesh geometry={knobGeometry} position={[KNOB.x, RAISED_1_Y, KNOB.z]} castShadow receiveShadow>
          <meshStandardMaterial color="#e7ebf2" roughness={0.5} metalness={0.08} />
          <Html
            position={[0, KNOB.bodyHeight + KNOB.domeHeight + 4, 0]}
            center
            distanceFactor={220}
            className="tdd-label"
          >
            elev 1 &middot; convex
          </Html>
        </mesh>

        <mesh
          geometry={chamferBtnGeometry}
          position={[CHAMFER_BTN.x, RAISED_1_Y, CHAMFER_BTN.z]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#f4f6fa" roughness={0.7} metalness={0.05} />
          <Html
            position={[0, CHAMFER_BTN.thickness + 4, 0]}
            center
            distanceFactor={220}
            className="tdd-label"
          >
            elev 1 &middot; chamfer
          </Html>
        </mesh>
      </group>

      <group ref={raised2Ref}>
        <mesh
          geometry={filletBtnGeometry}
          position={[FILLET_BTN.x, RAISED_2_Y, FILLET_BTN.z]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#f4f6fa" roughness={0.7} metalness={0.05} />
          <Html
            position={[0, FILLET_BTN.thickness + 4, 0]}
            center
            distanceFactor={220}
            className="tdd-label"
          >
            elev 2 &middot; fillet
          </Html>
        </mesh>
      </group>

      <OrbitControls
        makeDefault
        target={[0, 14, 0]}
        enablePan={false}
        minDistance={110}
        maxDistance={340}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
      />
    </>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function LightPad({
  x,
  y,
  onChange
}: {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
}) {
  const padRef = useRef<HTMLDivElement>(null);

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
      onChange(clamp(nx, -1, 1), clamp(ny, -1, 1));
    },
    [onChange]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPoint(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    updateFromPoint(event.clientX, event.clientY);
  };

  return (
    <div
      ref={padRef}
      className="tdd-pad"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      role="slider"
      aria-label="Light direction"
      aria-valuetext={`x ${x.toFixed(2)}, y ${y.toFixed(2)}`}
      tabIndex={0}
    >
      <div className="tdd-pad-crosshair" />
      <div
        className="tdd-pad-dot"
        style={{ left: `${((x + 1) / 2) * 100}%`, top: `${((y + 1) / 2) * 100}%` }}
      />
    </div>
  );
}

function IntensitySlider({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="tdd-slider-row">
      <span className="tdd-slider-label">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="tdd-slider"
      />
      <span className="tdd-slider-value">{value.toFixed(2)}</span>
    </label>
  );
}

export default function ConceptScene3D() {
  const [lightX, setLightX] = useState(LIGHT_DEFAULTS.x);
  const [lightY, setLightY] = useState(LIGHT_DEFAULTS.y);
  const [keyIntensity, setKeyIntensity] = useState(LIGHT_DEFAULTS.key);
  const [fillIntensity, setFillIntensity] = useState(LIGHT_DEFAULTS.fill);
  const [exploded, setExploded] = useState(false);

  const handleLightChange = useCallback((x: number, y: number) => {
    setLightX(x);
    setLightY(y);
  }, []);

  const cameraProps = useMemo(() => ({ position: [20, 90, 210] as [number, number, number], fov: 30 }), []);

  return (
    <section className="tdd-wrapper">
      <div className="tdd-header">
        <div>
          <h3 className="tdd-title">Lighting model, in 3D</h3>
          <p className="tdd-help">
            Drag to orbit. The CSS renders this scene as a flat orthographic front view —
            here you can see the depth and lighting it's approximating.
          </p>
        </div>
        <button type="button" className="tdd-toggle" onClick={() => setExploded((v) => !v)}>
          {exploded ? "Collapse" : "Explode"}
        </button>
      </div>

      <div className="tdd-stage">
        <div className="tdd-canvas">
          <Canvas shadows camera={cameraProps} dpr={[1, 2]}>
            <SceneContents
              lightX={lightX}
              lightY={lightY}
              keyIntensity={keyIntensity}
              fillIntensity={fillIntensity}
              exploded={exploded}
            />
          </Canvas>
        </div>

        <div className="tdd-controls">
          <div className="tdd-control-group">
            <span className="tdd-control-title">Light direction</span>
            <LightPad x={lightX} y={lightY} onChange={handleLightChange} />
            <span className="tdd-control-hint">
              --amb-light-x: {lightX.toFixed(2)}, --amb-light-y: {lightY.toFixed(2)}
            </span>
          </div>
          <div className="tdd-control-group">
            <IntensitySlider label="Key" value={keyIntensity} onChange={setKeyIntensity} />
            <IntensitySlider label="Fill" value={fillIntensity} onChange={setFillIntensity} />
            <span className="tdd-control-hint">Fill lifts shadows without moving them.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
