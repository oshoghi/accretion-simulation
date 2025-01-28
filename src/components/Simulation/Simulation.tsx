import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Canvas, invalidate } from "@react-three/fiber";
import { Environment, Grid, OrbitControls, Text } from "@react-three/drei";
import { DoubleSide, Vector3 } from "three";
import { generateParticle, ParticleRepresentation, updateParticlePositions, PLANET_RADIUS, isInsidePlanet, applyCollision, randomNumber, didParticlesCollide, addParticles, centerPosition } from "./utils";
import { InstancedParticles } from "./Particle";

export interface SimulationProps {
    replenishParticles?: boolean;
    startParticleCount?: number;
}

export const Simulation = ({ replenishParticles = true, startParticleCount = 50000 }: SimulationProps) => {
    const [numParticles, setNumParticles] = useState(startParticleCount);
    const [particles, setParticles] = useState<ParticleRepresentation[]>([]);
    const animationFrameRef = useRef<number>();

    const updateParticles = () => {
        setParticles(prevParticles => {
            let newParticles = updateParticlePositions(prevParticles);
            invalidate();
            
            // Remove particles that have fallen into the planet
            newParticles = newParticles
                .filter(particle => !isInsidePlanet(particle.position) && particle.position.distanceTo(centerPosition) < 100);

            // Add new particles if count is less than numParticles
            if (numParticles - newParticles.length > 100 && replenishParticles) {
                newParticles = addParticles(newParticles, numParticles - newParticles.length);
            }

            // keep particles in the same cell together
            newParticles.sort((a, b) => a.cell.localeCompare(b.cell));

            // Check collisions
            for (let i = 0; i < newParticles.length; i++) {
                const p1 = newParticles[i];

                // if (p1.switchColorBackAt && p1.switchColorBackAt < Date.now()) {
                //     p1.color = null;
                // }

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
        <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
            <Canvas shadows={false}
                gl={{ 
                    localClippingEnabled: true, 
                    sortObjects: false,
                    antialias: false,
                    powerPreference: "high-performance"
                }}
                camera={{ position: [0, 0, 15], fov: 75 }}
                frameloop="demand"
                performance={{ min: 0.5 }}
                style={{ background: 'black' }}>

                <Environment preset="city" />
                
                <ambientLight intensity={0.3} />
                <directionalLight position={[10, 10, 5]} intensity={0.7} castShadow={false} />

                <OrbitControls 
                    enablePan={true} 
                    enableZoom={true} 
                    enableRotate={true} 
                    enableDamping={true}
                    maxDistance={50}
                    minDistance={2} 
                />

                <Text
                    position={[0, 0, 0]}
                    color="white"
                    fontSize={1}
                    font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf"
                    anchorX="center"
                    anchorY="middle">
                    {particles.length}
                </Text>

                {/* <Grid 
                    args={[50, 50]} 
                    position={[0, 0, 0]}
                    cellSize={1}
                    cellThickness={1}
                    cellColor="#6f6f6f"
                    sectionSize={2}
                    side={DoubleSide} /> */}

                <mesh>
                    <sphereGeometry args={[PLANET_RADIUS]} />
                    <meshStandardMaterial transparent opacity={0.1} color="yellow" />
                </mesh>

                <InstancedParticles particles={particles} />
            </Canvas>
        </div>
    );
}