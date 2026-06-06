import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GoalItem, ClusterItem } from "../types";

// Dynamic colors mapping with a stable hashing algorithm for new clusters
export function getClusterColor(id: string): string {
  const staticColors: Record<string, string> = {
    chatbot: "#3b82f6",     // Vibrant Blue
    automation: "#10b981",  // Emerald Green
    content: "#ec4899",     // Hot Pink
    data: "#f59e0b",        // Gold/Amber
    business: "#8b5cf6",    // Amethyst Purple
    education: "#06b6d4",   // Electric Cyan
    other: "#64748b"        // Slate Gray/Fallback
  };

  if (staticColors[id]) return staticColors[id];

  // Dynamic colors list of elegant vivid galaxy shades
  const colorsList = [
    "#f43f5e", // Rose
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#3b82f6", // Blue
    "#14b8a6", // Teal
    "#f97316", // Orange
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colorsList.length;
  return colorsList[idx];
}

interface GalaxySceneProps {
  goals: GoalItem[];
  clusters: ClusterItem[];
  selectedGoalId: string | null;
  onSelectGoal: (goal: GoalItem) => void;
}

// Custom animated procedural shader for the futuristic planet atmosphere & surface
interface PlanetCustomMaterialProps {
  color: string;
}

function PlanetCustomMaterial({ color }: PlanetCustomMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const uniforms = React.useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uTime: { value: 0 },
  }), [color]);

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={`
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -vViewPosition.xyz; // view coordinate direction
          gl_Position = projectionMatrix * mvPosition;
        }
      `}
      fragmentShader={`
        uniform vec3 uColor;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        // Visual cloud-like smooth pseudo noise generator
        float rand(vec2 n) { 
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u*u*(3.0-2.0*u);
          
          float res = mix(
            mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
            mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
          return res*res;
        }

        void main() {
          // Animate gas-bands wrapping the sphere horizontally
          float stripes = sin(vUv.y * 32.0 + uTime * 0.45) * 0.5 + 0.5;
          float detailNoise = noise(vUv * 15.0 + vec2(uTime * 0.2, uTime * 0.08));
          
          // Mix secondary ambient dark elements to enrich colors
          vec3 ambientColor = uColor * 0.15;
          vec3 planetSurface = mix(ambientColor, uColor * 1.8, stripes * 0.4 + detailNoise * 0.6);
          
          // Atmospheric Rim Glow (Fresnel Equation)
          vec3 normal = normalize(vNormal);
          vec3 viewDir = vec3(0.0, 0.0, 1.0); // Simple projection approach for standard shaders
          float intensity = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
          vec3 rimGlow = uColor * intensity * 2.2;
          
          gl_FragColor = vec4(planetSurface + rimGlow, 0.95);
        }
      `}
      transparent
    />
  );
}

// Orbit track visual with small moving energy sparks circling around key planets
interface MovingSparkProps {
  radius: number;
  speed: number;
  color: string;
  phaseOffset: number;
  tiltAngleX: number;
  tiltAngleZ: number;
}

function MovingSpark({ radius, speed, color, phaseOffset, tiltAngleX, tiltAngleZ }: MovingSparkProps) {
  const sparkRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sparkRef.current) {
      const t = state.clock.getElapsedTime() * speed + phaseOffset;
      // Position calculation in tilted 3D plane
      const rawX = radius * Math.cos(t);
      const rawZ = radius * Math.sin(t);
      
      // Rotate coordinates
      const rotatedX = rawX * Math.cos(tiltAngleZ) - rawZ * Math.sin(tiltAngleZ);
      const rotatedZ = rawX * Math.sin(tiltAngleZ) + rawZ * Math.cos(tiltAngleZ);
      const rotatedY = rotatedZ * Math.sin(tiltAngleX);

      sparkRef.current.position.set(rotatedX, rotatedY, rotatedZ * Math.cos(tiltAngleX));
    }
  });

  return (
    <group>
      {/* Visual orbit trace line */}
      <mesh rotation={[tiltAngleX, 0, tiltAngleZ]}>
        <ringGeometry args={[radius - 0.015, radius + 0.015, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* Spark sphere */}
      <mesh ref={sparkRef}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Inner Component for animated Cluster Planet with realistic camera depth-scaling
interface ClusterPlanetProps {
  id: string;
  name: string;
  position: [number, number, number];
  goalsCount: number;
}

function ClusterPlanet({ id, name, position, goalsCount }: ClusterPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const color = getClusterColor(id);

  // Rotate planet base and calculate dynamic camera depth scale
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.12;
    }
    if (coreRef.current) {
      // Spinning internal wireframe core the opposite way
      coreRef.current.rotation.y = -state.clock.getElapsedTime() * 0.25;
      coreRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
    }

    if (groupRef.current) {
      // Calculate distance between planet group and active camera
      const cameraPosition = state.camera.position;
      const worldPosition = new THREE.Vector3(...position);
      const distance = cameraPosition.distanceTo(worldPosition);

      // Average default standard camera distance is around 21 (FOV:60, camera pos at [0, 8, 21])
      // Target dynamic multiplier: closer = larger, further = smaller (realistic depth rendering)
      const scaleFactor = THREE.MathUtils.clamp(20.0 / distance, 0.65, 1.85);
      groupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  });

  // Scale planet dynamically to be beautifully visible and well-proportioned
  const baseSize = 0.68;
  const sizeMultiplier = Math.min(0.32, goalsCount * 0.025);
  const finalRadius = baseSize + sizeMultiplier;

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Deep Atmosphere Glowing Halo Shroud */}
      <mesh>
        <sphereGeometry args={[finalRadius * 1.25, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* 2. Interactive Outer Grid Sphere Wireframe (Tech Layer) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[finalRadius * 1.05, 12, 12]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.12} />
      </mesh>

      {/* 3. Main Planet Sphere with Custom Gaseous Shader Material */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[finalRadius, 32, 32]} />
        <PlanetCustomMaterial color={color} />
      </mesh>

      {/* 4. Elegant Concentric Saturn-like Rings (Wide disk) */}
      <group rotation={[Math.PI / 2.3, Math.PI / 9, 0]}>
        {/* Main wide ring band */}
        <mesh>
          <ringGeometry args={[finalRadius * 1.35, finalRadius * 1.85, 64]} />
          <meshStandardMaterial 
            color={color} 
            transparent 
            opacity={0.38} 
            side={THREE.DoubleSide} 
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>
        {/* Fine secondary neon ring path */}
        <mesh>
          <ringGeometry args={[finalRadius * 1.95, finalRadius * 1.98, 64]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.2} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </group>

      {/* 5. Glowing Interstellar Energy Sparks Flying on Coordinates */}
      <MovingSpark 
        radius={finalRadius * 2.1} 
        speed={1.2} 
        color={color} 
        phaseOffset={0} 
        tiltAngleX={Math.PI / 6} 
        tiltAngleZ={Math.PI / 7} 
      />
      <MovingSpark 
        radius={finalRadius * 2.4} 
        speed={0.8} 
        color={color} 
        phaseOffset={Math.PI} 
        tiltAngleX={-Math.PI / 5} 
        tiltAngleZ={Math.PI / 4} 
      />

      {/* HTML Tag HUD overlay - bold, large, and beautifully visible */}
      <Html distanceFactor={14} position={[0, finalRadius + 1.1, 0]} center>
        <div className="select-none pointer-events-none text-center bg-slate-950/90 border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md whitespace-nowrap transition-all border-indigo-900/45">
          <p className="text-[17px] md:text-[19px] font-black tracking-widest uppercase mb-1" style={{ color }}>
            {name}
          </p>
          <span className="text-[12px] text-slate-200 font-mono font-extrabold bg-slate-900/60 border border-slate-800/25 px-2.5 py-0.5 rounded-full select-none">
            {goalsCount} học viên
          </span>
        </div>
      </Html>
    </group>
  );
}

// Inner component for Goal Nodes
interface GoalNodeProps {
  goal: GoalItem;
  isSelected: boolean;
  onSelect: () => void;
}

function GoalNode({ goal, isSelected, onSelect }: GoalNodeProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const color = getClusterColor(goal.cluster);

  useFrame((state) => {
    if (meshRef.current) {
      // Bob up and down slightly
      const bounce = Math.sin(state.clock.getElapsedTime() * 2 + goal.x * 10) * 0.04;
      meshRef.current.position.y = goal.y + bounce;
    }
  });

  const baseRadius = 0.22;
  let finalRadius = baseRadius;
  if (isSelected) finalRadius = baseRadius * 1.8;
  else if (hovered) finalRadius = baseRadius * 1.45;

  return (
    <group>
      {/* Tiny node */}
      <mesh
        ref={meshRef}
        position={[goal.x, goal.y, goal.z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[finalRadius, 16, 16]} />
        <meshStandardMaterial
          color={hovered || isSelected ? "#ffffff" : color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.2 : hovered ? 1.0 : 0.6}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>

      {/* Beautiful tooltip detailing name and project idea on hover */}
      {(hovered || isSelected) && (
        <Html distanceFactor={14} position={[goal.x, goal.y + 0.6, goal.z]} center>
          <div className="select-none pointer-events-none w-[340px] p-5 bg-slate-950/95 border border-indigo-500/50 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col gap-3.5 transition-all animate-fade-in z-50">
            {/* Header: User Name & Group Info */}
            <div className="flex items-center justify-between gap-3 border-b border-indigo-950/80 pb-2.5">
              <span className="text-[15px] font-black text-white uppercase tracking-wide truncate max-w-[190px] flex items-center gap-2 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block shrink-0 animate-pulse" />
                {goal.name}
              </span>
              <span className="text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 shrink-0">
                {goal.clusterLabel || "AI Idea"}
              </span>
            </div>
            
            {/* Body: Course Goal / Idea */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-indigo-300/90 uppercase tracking-widest font-extrabold font-mono">Ý tưởng & Mục tiêu:</span>
              <p className="text-[14px] text-slate-100 leading-relaxed font-sans font-bold whitespace-normal break-words">
                {goal.goal}
              </p>
            </div>

            {isSelected && (
              <div className="text-[11px] text-center font-extrabold tracking-widest text-emerald-400 uppercase mt-1 bg-emerald-950/50 py-1.5 rounded-xl border border-emerald-800/40 animate-pulse">
                ✨ Đang chọn • Chi tiết ở bảng
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// Lines drawing from node to cluster center
interface ClusterLineProps {
  from: [number, number, number];
  to: [number, number, number];
  clusterId: string;
}

function ClusterLine({ from, to, clusterId }: ClusterLineProps) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const color = getClusterColor(clusterId);

  const lineObj = React.useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15 });
    return new THREE.Line(lineGeometry, mat);
  }, [from, to, color]);

  return <primitive object={lineObj} />;
}

export default function GalaxyScene({ goals, clusters, selectedGoalId, onSelectGoal }: GalaxySceneProps) {
  // Count unique students per cluster for sphere size and labels
  const uniqueStudentsPerCluster = React.useMemo(() => {
    return goals.reduce<Record<string, Set<string>>>((acc, item) => {
      if (!acc[item.cluster]) {
        acc[item.cluster] = new Set<string>();
      }
      const studentKey = item.email && item.email.trim()
        ? item.email.trim().toLowerCase()
        : item.name.trim().toLowerCase();
      acc[item.cluster].add(studentKey);
      return acc;
    }, {});
  }, [goals]);

  return (
    <div className="w-full h-full relative" id="galaxy-viewport-container">
      {/* Helper floating controls reminder */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none select-none text-[10px] uppercase tracking-widest text-slate-300 font-mono bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/10 shadow-md">
        🖱️ Giữ chuột trái xoay • Lăn nút giữa thu phóng
      </div>

      <Canvas
        id="three-canvas"
        camera={{ position: [0, 8, 21], fov: 60 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 10, 5]} intensity={1.5} />
        <pointLight position={[-5, -10, -5]} intensity={0.5} />

        {/* Night stargaze sky */}
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0.5} fade speed={1} />

        {/* Render core clusters */}
        {clusters.map((cluster) => {
          const count = uniqueStudentsPerCluster[cluster.id]?.size || 0;
          return (
            <ClusterPlanet
              key={cluster.id}
              id={cluster.id}
              name={cluster.name}
              position={cluster.position}
              goalsCount={count}
            />
          );
        })}

        {/* Render Lines from goals to clusters */}
        {goals.map((item) => {
          const matchedCluster = clusters.find((c) => c.id === item.cluster);
          if (!matchedCluster) return null;
          return (
            <ClusterLine
              key={`line-${item.id}`}
              from={[item.x, item.y, item.z]}
              to={matchedCluster.position}
              clusterId={item.cluster}
            />
          );
        })}

        {/* Render Goal Nodes */}
        {goals.map((item) => (
          <GoalNode
            key={item.id}
            goal={item}
            isSelected={selectedGoalId === item.id}
            onSelect={() => onSelectGoal(item)}
          />
        ))}

        {/* Smooth auto rotation controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxDistance={45}
          minDistance={3}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
