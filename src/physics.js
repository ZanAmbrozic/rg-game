import { vec3 } from 'gl-matrix';
import { Transform } from './engine/core/Transform.js';
import { Mesh } from './engine/core/Mesh.js';
import { Model } from './engine/core/Model.js';
import { getGlobalModelMatrix } from './engine/core/SceneUtils.js';
import { scene } from './main.js';

export default class Physics {
    /**
     * @param {Node} player
     * @param {Node} playerCollider
     */
    constructor(player, playerCollider) {
        this.playerCollider = playerCollider;
        this.playerTranslation =
            player.getComponentOfType(Transform).translation;
    }

    update() {
        scene.traverse((node) => {
            if (
                node !== this.playerCollider &&
                !!node.customProperties.collider
            ) {
                this.resolveCollision(node);
            }
        });
    }

    /**
     * @param {Node} node
     */
    resolveCollision(node) {
        const meshA = this.getGlobalMesh(this.playerCollider);
        const meshB = this.getGlobalMesh(node);

        const axesToTest = [
            ...this.getFaceNormals(meshA),
            ...this.getFaceNormals(meshB),
        ];

        const edgesA = this.getEdges(meshA);
        const edgesB = this.getEdges(meshB);

        for (const edgeA of edgesA) {
            for (const edgeB of edgesB) {
                const axis = vec3.create();
                vec3.cross(axis, edgeA, edgeB);

                if (vec3.len(axis) > 1e-6) {
                    vec3.normalize(axis, axis);
                    axesToTest.push(axis);
                }
            }
        }

        /** @type {vec3|null} */
        let mtvAxis = null;
        let mtvOverlap = Infinity;

        for (const axis of axesToTest) {
            const projA = this.projectOntoAxis(meshA.vertices, axis);
            const projB = this.projectOntoAxis(meshB.vertices, axis);

            if (!this.isOverlapping(projA, projB)) {
                return;
            }

            const overlap =
                Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
            if (overlap < mtvOverlap) {
                mtvOverlap = overlap;
                mtvAxis = vec3.clone(axis);
            }
        }

        if (mtvAxis && mtvOverlap < Infinity) {
            const transformA =
                this.playerCollider.getComponentOfType(Transform);
            const transformB = node.getComponentOfType(Transform);

            const direction = vec3.create();
            vec3.subtract(
                direction,
                transformB.globalTranslation,
                transformA.globalTranslation,
            );
            if (vec3.dot(direction, mtvAxis) < 0) {
                vec3.negate(mtvAxis, mtvAxis);
            }

            const mtv = vec3.create();
            vec3.scale(mtv, mtvAxis, mtvOverlap);

            vec3.scaleAndAdd(
                this.playerTranslation,
                this.playerTranslation,
                mtv,
                -1,
            );
        }
    }

    /**
     * @param {Node} node
     * @return {{vertices: vec3[], indices: number[]}}
     */
    getGlobalMesh(node) {
        /** @type {Model} */
        const model = node.getComponentOfType(Model);

        const matrix = getGlobalModelMatrix(node);

        /** @type {Mesh} */
        const mesh = model.primitives[0].mesh;

        return {
            vertices: mesh.vertices.map((v) =>
                vec3.transformMat4(vec3.create(), v.position, matrix),
            ),
            indices: mesh.indices.map((i) => i[0]),
        };
    }

    /**
     * @param {vec3[]} vertices
     * @param {vec3} axis
     * @returns {{min: number, max: number}}
     */
    projectOntoAxis(vertices, axis) {
        let min = Infinity;
        let max = -Infinity;

        for (let i = 0; i < vertices.length; i++) {
            const projection = vec3.dot(vertices[i], axis);
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }

        return { min, max };
    }

    /**
     * @param {{min: number, max: number}} a
     * @param {{min: number, max: number}} b
     * @returns {boolean}
     */
    isOverlapping(a, b) {
        return !(a.max < b.min || b.max < a.min);
    }

    /**
     * @param {{vertices: vec3[], indices: number[]}}
     * @returns {vec3[]}
     */
    getFaceNormals({ vertices, indices }) {
        const normals = [];

        for (let i = 0; i < indices.length / 3; i += 3) {
            const v0 = vertices[indices[i]];
            const v1 = vertices[indices[i + 1]];
            const v2 = vertices[indices[i + 2]];

            const edge1 = vec3.create();
            const edge2 = vec3.create();
            vec3.subtract(edge1, v1, v0);
            vec3.subtract(edge2, v2, v0);

            const normal = vec3.create();
            vec3.cross(normal, edge1, edge2);
            vec3.normalize(normal, normal);

            normals.push(normal);
        }

        return normals;
    }

    /**
     * @param {{vertices: vec3[], indices: number[]}}
     * @returns {vec3[]}
     */
    getEdges({ vertices, indices }) {
        const edges = [];
        for (let i = 0; i < indices.length / 3; i += 3) {
            for (let j = 0; j < 3; j++) {
                const start = vertices[indices[i + j]];
                const end = vertices[indices[i + ((j + 1) % 3)]];

                const edge = vec3.create();
                vec3.subtract(edge, end, start);
                edges.push(edge);
            }
        }
        return edges;
    }
}
