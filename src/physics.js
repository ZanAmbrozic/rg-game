import { scene } from './main.js';
import RigidBody from './engine/physics/RigidBody.js';
import { Transform } from './engine/core/Transform.js';
import { calculateAxisAlignedBoundingBox } from './engine/core/MeshUtils.js';
import { vec3 } from 'gl-matrix';
import { getGlobalModelMatrix } from './engine/core/SceneUtils.js';
import { Model } from './engine/core/Model.js';

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

    getTransformedAABB(node) {
        // Transform all vertices of the AABB from local to global space.
        let matrix = getGlobalModelMatrix(node);

        /** @type {vec3} */
        let min = [-0.1, -1, -0.1],
            max = [0.1, 1, 0.1];

        const collider = node.find((node) => !!node.customProperties.collider);
        if (collider) {
            matrix = getGlobalModelMatrix(collider);
            /** @type {Model} */
            const model = collider.getComponentOfType(Model);
            if (model) {
                const bb = calculateAxisAlignedBoundingBox(
                    model.primitives[0].mesh,
                );
                min = bb.min;
                max = bb.max;
            }
        } else {
            const model = node.getComponentOfType(Model);
            if (model) {
                const bb = calculateAxisAlignedBoundingBox(
                    model.primitives[0].mesh,
                );
                min = bb.min;
                max = bb.max;
            }
        }

        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map((v) => vec3.transformMat4(v, v, matrix));

        // Find new min and max by component.
        const xs = vertices.map((v) => v[0]);
        const ys = vertices.map((v) => v[1]);
        const zs = vertices.map((v) => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }

    /**
     * @param {Node} a
     * @param {Node} b
     */
    resolveCollision(a, b) {
        // Get global space AABBs.
        const aBox = this.getTransformedAABB(a);
        const bBox = this.getTransformedAABB(b);

        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding) {
            return;
        }

        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
        const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        const transform = a.getComponentOfType(Transform);
        if (!transform) {
            return;
        }

        vec3.add(transform.translation, transform.translation, minDirection);
    }
}
