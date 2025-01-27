import { DoubleSide, MeshStandardMaterial, Vector3 } from "three";

export const PLANET_RADIUS = 3;
export const PLANET_BOUNDS = { maxX: PLANET_RADIUS, maxY: PLANET_RADIUS, maxZ: PLANET_RADIUS };
export const G = 0.1; // Gravitational constant (adjusted for simulation scale)
export const centerMass = 10; // Mass of the central "planet"
export const centerPosition = new Vector3(0, 0, 0);

export const basicMaterial = new MeshStandardMaterial({
    color: 0xc8c8c8,
    metalness: 0.4,
    roughness: 0.4,
    side: DoubleSide,
});

export interface ParticleRepresentation {
    position: Vector3;
    velocity: Vector3;
    mass: number;
    radius: number;
}

export const isValidPosition = (position: Vector3, bounds: Bounds) => {
    return Math.abs(position.x) >= bounds.maxX ||
           Math.abs(position.y) >= bounds.maxY ||
           Math.abs(position.z) >= bounds.maxZ;
};

export const generateMass = () => randomNumber(0.001, 0.01);
export const generateRadius = () => randomNumber(0.005, 0.1);
export const randomNumber = (min: number, max: number) => min + Math.random() * (max - min);

export const generateOrbitalVelocity = (position: Vector3) => {
    const r = position.length();
    const speed = Math.sqrt((G * centerMass) / r);
    const up = new Vector3(0, 1, 0);
    const orbitPlaneNormal = position.clone().cross(up).normalize();
    const velocity = position.clone().cross(orbitPlaneNormal).normalize().multiplyScalar(speed);
    return velocity;
}

export interface Bounds {
    maxX: number;
    maxY: number;
    maxZ: number;
}

export const generateParticle = (bounds: Bounds | null = null): ParticleRepresentation => {
    let position;
    do {
        position = new Vector3(
            randomNumber(-10, 10),
            randomNumber(-10, 10),
            randomNumber(-10, 10)
        );
    } while (!isValidPosition(position, bounds ?? PLANET_BOUNDS));

    return {
        position,
        velocity: generateOrbitalVelocity(position),
        mass: generateMass(), // mass between 0.1 and 1
        radius: generateRadius() // radius between 0.1 and 0.5
    };
};

export const applyGravity = (particle: ParticleRepresentation) => {
    const r = particle.position.distanceTo(centerPosition);

    if (r === 0) return; // Avoid division by zero
    
    const forceMagnitude = G * (centerMass * particle.mass) / (r * r);
    const direction = centerPosition.clone().sub(particle.position).normalize();
    const acceleration = direction.multiplyScalar(forceMagnitude / particle.mass);

    particle.velocity.add(acceleration.multiplyScalar(0.016));
};

export const updateParticlePositions = (particles: ParticleRepresentation[]) => {
    return particles.map(particle => {
        applyGravity(particle);
        particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
        return particle;
    });
};

export const findFurthestParticles = (particles: ParticleRepresentation[]) => {
    let maxX = 0, maxY = 0, maxZ = 0;
    for (const particle of particles) {
        maxX = Math.max(maxX, Math.abs(particle.position.x));
        maxY = Math.max(maxY, Math.abs(particle.position.y));
        maxZ = Math.max(maxZ, Math.abs(particle.position.z));
    }
    return { maxX, maxY, maxZ };
};