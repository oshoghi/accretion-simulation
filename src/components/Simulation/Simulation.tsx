import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Particle } from "./Particle";
import { Canvas } from "@react-three/fiber";
import { Environment, Grid, OrbitControls, Sphere } from "@react-three/drei";
import { generateParticle, isValidPosition, ParticleRepresentation, updateParticlePositions, findFurthestParticles, PLANET_BOUNDS, PLANET_RADIUS } from "./utils";

export interface BaseRendererProps {
    isLoading?: boolean;
    children?: ReactNode;
}

export const Simulation = () => {
    const [numParticles, setNumParticles] = useState(5);
    const [particles, setParticles] = useState<ParticleRepresentation[]>([]);
    const animationFrameRef = useRef<number>();

    const updateParticles = () => {
        setParticles(prevParticles => {
            let newParticles = updateParticlePositions(prevParticles);
            
            // Remove particles that have fallen into the planet
            newParticles = newParticles.filter(particle => isValidPosition(particle.position, PLANET_BOUNDS));

            // Add new particles if count is less than numParticles
            if (newParticles.length < numParticles) {
                const { maxX, maxY, maxZ } = findFurthestParticles(newParticles);

                for (let i = 0; i < numParticles - newParticles.length; i++) {
                    newParticles.push(generateParticle({ maxX, maxY, maxZ }));
                }
            }

            // Check collisions
            for (let i = 0; i < newParticles.length; i++) {
                for (let j = i + 1; j < newParticles.length; j++) {
                    const p1 = newParticles[i];
                    const p2 = newParticles[j];

                    const distance = p1.position.distanceTo(p2.position);
                    const minDistance = p1.radius + p2.radius;

                    if (distance < minDistance) {
                        // Collision detected - calculate new velocities
                        const normal = p1.position.clone().sub(p2.position).normalize();
                        
                        const relativeVelocity = p1.velocity.clone().sub(p2.velocity);
                        const velocityAlongNormal = relativeVelocity.dot(normal);
                        
                        // Only resolve if objects are moving toward each other
                        if (velocityAlongNormal > 0) return prevParticles;

                        const restitution = 0.9; // Coefficient of restitution
                        const j = -(1 + restitution) * velocityAlongNormal;
                        const impulse = j / (1/p1.mass + 1/p2.mass);
                        
                        p1.velocity.add(normal.clone().multiplyScalar(impulse / p1.mass));
                        p2.velocity.sub(normal.clone().multiplyScalar(impulse / p2.mass));

                        // Separate particles to prevent sticking
                        const overlap = minDistance - distance;
                        const separationVector = normal.multiplyScalar(overlap * 0.5);
                        p1.position.add(separationVector);
                        p2.position.sub(separationVector);
                    }
                }
            }

            return newParticles;
        });

        animationFrameRef.current = requestAnimationFrame(updateParticles);
    };

    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(updateParticles);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const particleArray = Array.from({ length: numParticles }, () => generateParticle());
        setParticles(particleArray);
    }, []);

    const updateNumParticles = (value: number) => {
        setNumParticles(value);
        const particleArray = Array.from({ length: value }, () => generateParticle());
        setParticles(particleArray);
    }

    return (
        <div style={{ width: '100vw', height: 'calc(100vh - 50px)', marginTop: 50 }}>
            {/* <Slider value={numParticles} 
                style={{ position: 'absolute', top: 10, left: 10, width: 'calc(100% - 20px)' }}
                onChange={updateNumParticles} 
                min={100} 
                max={10000} 
                step={100} /> */}

            <Canvas shadows
                gl={{ localClippingEnabled: true, sortObjects: false }}
                camera={{ position: [2, 5, -10], fov: 75 }}>

                <Environment preset="city" />
                
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />

                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} enableDamping={false} />

                <Grid 
                    args={[10, 10]} 
                    position={[0, 0, 0]}
                    cellSize={1}
                    cellThickness={1}
                    cellColor="#6f6f6f"
                    sectionSize={2} />

                <mesh>
                    <sphereGeometry args={[PLANET_RADIUS]} />
                    <meshStandardMaterial transparent opacity={0.2} color="blue" />
                </mesh>


                {particles.map((particle, index) => (
                    <Particle 
                        key={index}
                        position={particle.position}
                        velocity={particle.velocity}
                        mass={particle.mass}
                        radius={particle.radius} />
                ))}
            </Canvas>
        </div>
    );
}