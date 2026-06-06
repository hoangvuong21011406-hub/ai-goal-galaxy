import { clusters } from "../data/clusters";

export function generateNodePosition(clusterId: string) {
  const cluster = clusters.find(c => c.id === clusterId) || clusters.find(c => c.id === "other") || { position: [0, 0, 0] };
  const [cx, cy, cz] = cluster.position;

  // Spherical coordinate distribution around cluster coordinates
  const radius = 1.1 + Math.random() * 1.3; // Generates around 1.1 to 2.4 radius
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  return {
    x: Number((cx + radius * Math.sin(phi) * Math.cos(theta)).toFixed(3)),
    y: Number((cy + radius * Math.sin(phi) * Math.sin(theta)).toFixed(3)),
    z: Number((cz + radius * Math.cos(phi)).toFixed(3))
  };
}
