import { DoubleSide, MeshStandardMaterial, Vector3 } from "three";

export const PLANET_RADIUS = 3;
export const PLANET_BOUNDS = { maxX: PLANET_RADIUS, maxY: PLANET_RADIUS, maxZ: PLANET_RADIUS };
export const PLANET_MASS = 99999999;
export const centerMass = 10; // Mass of the central "planet"
export const centerPosition = new Vector3(0, 0, 0);
export const ANIMATION_SPEED = 10;
export const G = 6.674 * Math.pow(10, -11); // Gravitational constant

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
export const generateRadius = () => randomNumber(0.005, 0.04);
export const randomNumber = (min: number, max: number) => min + Math.random() * (max - min);

export const generateOrbitalVelocity = (particle: ParticleRepresentation) => {
    const { position: p1 } = particle;
    const orbitalRadius = p1.length();

    // Ensure the radius is non-zero to avoid division by zero
    if (orbitalRadius === 0) {
        throw new Error("Particle is at the center of the central mass; cannot compute orbital velocity.");
    }

    // Calculate the orbital speed for a circular orbit
    const orbitalSpeed = Math.sqrt((G * PLANET_MASS) / orbitalRadius);

    // Generate a random orbital plane
    const randomAxis = new Vector3(Math.random(), Math.random(), Math.random()).normalize();
    const randomAngle = Math.random() * Math.PI * 2; // Random angle in radians

    // Rotate the position vector around a random axis
    const rotatedPosition = p1.clone().applyAxisAngle(randomAxis, randomAngle);

    // Compute a perpendicular direction for velocity
    const velocityDirection = rotatedPosition.clone().cross(randomAxis).normalize();

    // Compute the velocity vector
    return velocityDirection.multiplyScalar(orbitalSpeed);
};

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

    const mass = generateMass();

    return {
        position,
        mass,
        velocity: generateOrbitalVelocity({ position, mass } as ParticleRepresentation),
        radius: generateRadius(), // radius between 0.1 and 0.5
        cell: getCell({ position } as ParticleRepresentation),
    };
};

export const applyGravity = (particle: ParticleRepresentation, timestep=1) => {
    const p1 = centerPosition;
    const m1 = centerMass;
    const { position: p2, mass: m2, velocity: v2 } = particle;

    // Calculate the distance vector between the two masses
    const distanceVector = new Vector3().subVectors(p1, p2);

    // Calculate the distance (magnitude of the distance vector)
    const distance = distanceVector.length();

    // Calculate the gravitational force magnitude
    const forceMagnitude = (G * m1 * m2) / (distance * distance);

    // Calculate the direction of the force (unit vector)
    const forceDirection = distanceVector.clone().normalize();

    // Calculate the acceleration of each mass
    const a = forceDirection.clone().multiplyScalar(forceMagnitude / m2);

    // Update velocities using the acceleration and time step
    const vFinal = v2.clone().add(a.multiplyScalar(timestep));

    particle.velocity = vFinal;
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
    const cellSize = 0.5;

    return [
        Math.round(position.x / cellSize),
        Math.round(position.y / cellSize),
        Math.round(position.z / cellSize),
    ].join(",");
};

export const didParticlesCollide = (p1: ParticleRepresentation, p2: ParticleRepresentation) => {
    const distance = p1.position.distanceTo(p2.position);
    const minDistance = p1.radius + p2.radius;

    return distance < minDistance;
};

export const elasticCollision = (p1: ParticleRepresentation, p2: ParticleRepresentation, elasticity=0.8) => {
    const { velocity: v1, mass: m1 } = p1;
    const { velocity: v2, mass: m2 } = p2;

    const relativeVelocity = new Vector3().subVectors(v1, v2);

    // Calculate the velocity along the line of collision
    const velocityAlongCollision = relativeVelocity.clone().normalize();

    // Calculate the dot product of relative velocity and the collision direction
    const dotProduct = relativeVelocity.dot(velocityAlongCollision);

    // Calculate the impulse scalar
    const impulseScalar = (-(1 + elasticity) * dotProduct) / (1/m1 + 1/m2);

    // Calculate the impulse vector
    const impulse = velocityAlongCollision.multiplyScalar(impulseScalar);

    // Update the velocities after the collision
    p1.velocity = v1.clone().add(impulse.clone().multiplyScalar(1/m1));
    p2.velocity = v2.clone().sub(impulse.clone().multiplyScalar(1/m2));
}

export const applyCollision = (p1: ParticleRepresentation, p2: ParticleRepresentation) => {
    elasticCollision(p1, p2);
    // p1.color = "black";
    // p2.color = "black";
    // p1.switchColorBackAt = Date.now() + 1000;
    // p2.switchColorBackAt = Date.now() + 1000;
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