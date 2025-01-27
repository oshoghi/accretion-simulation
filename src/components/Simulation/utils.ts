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
    cell?: string;
    color?: string;
    switchColorBackAt?: number;
}

export const isInsidePlanet = (position: Vector3) => {
    const results = Math.abs(position.x) <= PLANET_RADIUS &&
           Math.abs(position.y) <= PLANET_RADIUS &&
           Math.abs(position.z) <= PLANET_RADIUS;

    if (results === true) {
        // console.log(results, position);
    }

    return results;
};

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
    
    // Generate random reference vector instead of fixed up vector
    const randomRef = new Vector3(
        randomNumber(-1, 1),
        randomNumber(-1, 1),
        randomNumber(-1, 1)
    ).normalize();
    
    // If randomRef happens to be parallel to position, generate a new one
    if (Math.abs(randomRef.dot(position.clone().normalize())) > 0.99) {
        randomRef.set(
            randomNumber(-1, 1),
            randomNumber(-1, 1),
            randomNumber(-1, 1)
        ).normalize();
    }

    const orbitPlaneNormal = position.clone().cross(randomRef).normalize();
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
            randomNumber(-5, 5),
            randomNumber(-5, 5),
            randomNumber(-5, 5)
        );
    } while (!isValidPosition(position, bounds ?? PLANET_BOUNDS));

    return {
        position,
        velocity: generateOrbitalVelocity(position),
        mass: generateMass(), // mass between 0.1 and 1
        radius: generateRadius(), // radius between 0.1 and 0.5
        cell: getCell({ position } as ParticleRepresentation),
    };
};
export const ANIMATION_SPEED = 3;

export const applyGravity = (particle: ParticleRepresentation) => {
    const r = particle.position.distanceTo(centerPosition);

    if (r === 0) return; // Avoid division by zero
    
    const forceMagnitude = G * (centerMass * particle.mass) / (r * r);
    const direction = centerPosition.clone().sub(particle.position).normalize();
    const acceleration = direction.multiplyScalar(forceMagnitude / particle.mass);

    particle.velocity.add(acceleration.multiplyScalar(0.016 * ANIMATION_SPEED));
};

export const updateParticlePositions = (particles: ParticleRepresentation[]) => {
    return particles.map(particle => {
        applyGravity(particle);
        particle.position.add(particle.velocity.clone().multiplyScalar(0.016 * ANIMATION_SPEED));
        particle.cell = getCell(particle);
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

export const getCell = ({ position }: ParticleRepresentation) => {
    const cellSize = 0.1;

    return [
        Math.floor(position.x / cellSize), ",",
        Math.floor(position.y / cellSize), ",",
        Math.floor(position.z / cellSize),
    ].join("");
};

export const didParticlesCollide = (p1: ParticleRepresentation, p2: ParticleRepresentation) => {
    const distance = p1.position.distanceTo(p2.position);
    const minDistance = p1.radius + p2.radius;

    return distance < minDistance;
};

export const applyCollision = (p1: ParticleRepresentation, p2: ParticleRepresentation) => {
    const normal = p1.position.clone().sub(p2.position).normalize();
    const relativeVelocity = p1.velocity.clone().sub(p2.velocity);
    const velocityAlongNormal = relativeVelocity.dot(normal);
    const restitution = 0.9; // Coefficient of restitution
    const j = -(1 + restitution) * velocityAlongNormal;
    const impulse = j / (1/p1.mass + 1/p2.mass);

    p1.color = "black";
    p2.color = "black";
    p1.switchColorBackAt = Date.now() + 1000;
    p2.switchColorBackAt = Date.now() + 1000;
    
    p1.velocity.add(normal.clone().multiplyScalar(impulse / p1.mass));
    p2.velocity.sub(normal.clone().multiplyScalar(impulse / p2.mass));
};

export const addParticles = (particles: ParticleRepresentation[], count: number) => {
    const additionalParticles = Array.from({ length: count })
        .fill(null)
        .map(() => {

        // add new particles from the outside as if they have travalled in
        const newParticle = generateParticle()
        newParticle.position = new Vector3(
            newParticle.position.x + randomNumber(-3, 3),
            newParticle.position.y + randomNumber(-3, 3),
            newParticle.position.z + randomNumber(-3, 3));

        return newParticle;
    });

    return [...particles, ...additionalParticles];
};