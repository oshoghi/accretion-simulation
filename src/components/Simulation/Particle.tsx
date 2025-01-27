import { Line } from '@react-three/drei';
import React, { useRef } from 'react';
import { Color, InstancedMesh, Matrix4, Vector3 } from 'three';
import { ParticleRepresentation } from './utils';
import { useFrame } from '@react-three/fiber';

export const Particle: React.FC<ParticleRepresentation> = ({ position, velocity, mass, radius, color }) => {
    return (
        <group>
            <mesh position={[position.x, position.y, position.z]}>
                {/* <sphereGeometry args={[radius]} /> */}
                <boxGeometry args={[radius, radius, radius]} />
                <meshStandardMaterial color={color ?? "hotpink"} />
            </mesh>
            {
            /*showVector && false && (
                <Line 
                    points={[
                        position.x, position.y, position.z,
                        position.clone().add(velocity.clone().multiplyScalar(10)).x,
                        position.clone().add(velocity.clone().multiplyScalar(10)).y,
                        position.clone().add(velocity.clone().multiplyScalar(10)).z,
                    ]} 
                    color="red" 
                />
            )}*/
            }
        </group>
    );
};


export const InstancedParticles = ({ particles }: { particles: ParticleRepresentation[] }) => {
    const meshRef = useRef<InstancedMesh>(null);
    const matrix = new Matrix4();
    const color = new Color();

    useFrame(() => {
        if (!meshRef.current) return;
        particles.forEach((particle, i) => {
            matrix.identity();  // Reset the matrix
            matrix.scale(new Vector3(particle.radius /0.2, particle.radius / 0.2, particle.radius / 0.2));
            matrix.setPosition(particle.position);           
            meshRef.current!.setMatrixAt(i, matrix);
            meshRef.current!.setColorAt(i, color.set(particle.color || "hotpink"));
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.instanceColor!.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, particles.length]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial />
        </instancedMesh>
    );
}