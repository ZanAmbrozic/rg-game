import { scene } from './main.js';
import RigidBody from './engine/physics/RigidBody.js';
import { Transform } from './engine/core/Transform.js';
import { Mesh } from './engine/core/Mesh.js';
import { calculateAxisAlignedBoundingBox } from './engine/core/MeshUtils.js';

export default class Physics {
    constructor() {}

    update() {
        scene.traverse((node1) => {
            const rigidBody = node1.getComponentOfType(RigidBody);
            if (rigidBody && rigidBody.dynamic) {
                scene.traverse((node2) => {
                    const rigidBody2 = node2.getComponentOfType(RigidBody);
                    if (rigidBody2 && !rigidBody2.dynamic) {
                        this.resolveCollision(node1, node2);
                    }
                });
            }
        });
    }

    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        return (
            this.intervalIntersection(
                aabb1.min[0],
                aabb1.max[0],
                aabb2.min[0],
                aabb2.max[0],
            ) &&
            this.intervalIntersection(
                aabb1.min[1],
                aabb1.max[1],
                aabb2.min[1],
                aabb2.max[1],
            ) &&
            this.intervalIntersection(
                aabb1.min[2],
                aabb1.max[2],
                aabb2.min[2],
                aabb2.max[2],
            )
        );
    }

    /**
     * @param {Node} a
     * @param {Node} b
     */
    resolveCollision(a, b) {
        /** @type {Mesh} */
        const mesh1 = a.getComponentOfType(Mesh);

        const { max, min } = calculateAxisAlignedBoundingBox(mesh1);
    }
}
