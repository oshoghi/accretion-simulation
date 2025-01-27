import { Line } from '@react-three/drei';
import React, { useEffect, useRef } from 'react';
import { Group, Vector3 } from 'three';

interface ParticleObj {
    position: Vector3;
    velocity: Vector3;
    mass: number;
    radius: number;
}

interface ParticleProps {
    position: Vector3;
    velocity: Vector3;
    mass: number;
    radius: number;
}

export const Particle: React.FC<ParticleProps> = ({ position, velocity, mass, radius }) => {
    return (
        <group>
            <mesh position={[position.x, position.y, position.z]}>
                {/* <sphereGeometry args={[radius]} /> */}
                <boxGeometry args={[radius, radius, radius]} />
                <meshStandardMaterial color="hotpink" />
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
