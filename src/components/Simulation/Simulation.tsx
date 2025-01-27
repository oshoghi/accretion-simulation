import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Grid, OrbitControls, Text } from "@react-three/drei";
import { Vector3 } from "three";
import { generateParticle, ParticleRepresentation, updateParticlePositions, PLANET_RADIUS, isInsidePlanet, applyCollision, randomNumber, didParticlesCollide, addParticles } from "./utils";
import { InstancedParticles } from "./Particle";

export interface SimulationProps {
    replenishParticles?: boolean;
    startParticleCount?: number;
}

export const Simulation = ({ replenishParticles = false, startParticleCount = 5000 }: SimulationProps) => {
    const [numParticles, setNumParticles] = useState(startParticleCount);
    const [particles, setParticles] = useState<ParticleRepresentation[]>([]);
    const animationFrameRef = useRef<number>();

    const updateParticles = () => {
        setParticles(prevParticles => {
            let newParticles = updateParticlePositions(prevParticles);
            
            // Remove particles that have fallen into the planet
            newParticles = newParticles.filter(particle => !isInsidePlanet(particle.position));

            // Add new particles if count is less than numParticles
            if (numParticles - newParticles.length > 100 && replenishParticles) {
                newParticles = addParticles(newParticles, numParticles - newParticles.length);
            }

            // keep particles in the same cell together
            newParticles.sort((a, b) => a.cell.localeCompare(b.cell));

            // Check collisions
            for (let i = 0; i < newParticles.length; i++) {
                const p1 = newParticles[i];

                if (p1.switchColorBackAt && p1.switchColorBackAt < Date.now()) {
                    p1.color = "hotpink";
                }

                for (let j = i + 1; j < newParticles.length; j++) {
                    const p2 = newParticles[j];
                    
                    // Stop checking when we reach particles in a different cell
                    if (p1.cell !== p2.cell) break;

                    if (didParticlesCollide(p1, p2)) {
                        applyCollision(p1, p2);
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

    return (
        <div style={{ width: '100vw', height: 'calc(100vh - 50px)', marginTop: 50 }}>
            <Canvas shadows={false}
                gl={{ 
                    localClippingEnabled: true, 
                    sortObjects: false,
                    antialias: false,
                    powerPreference: "high-performance"
                }}
                camera={{ position: [2, 5, -10], fov: 75 }}
                frameloop="demand"
                performance={{ min: 0.5 }}>

                <Environment preset="city" />
                
                <ambientLight intensity={0.3} />
                <directionalLight position={[10, 10, 5]} intensity={0.7} castShadow={false} />

                <OrbitControls 
                    enablePan={true} 
                    enableZoom={true} 
                    enableRotate={true} 
                    enableDamping={false}
                    maxDistance={50}
                    minDistance={2} 
                />

                <Text
                    position={[0, 0, 0]}
                    color="black"
                    fontSize={1}
                    font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf"
                    anchorX="center"
                    anchorY="middle">
                    {particles.length}
                </Text>

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

                <InstancedParticles particles={particles} />
            </Canvas>
        </div>
    );
}