import { Component } from '../core/Component.js';
import { Transform } from '../core/Transform.js';

export class HorizontalMeshCollision extends Component {
    /**
     * @param {Mesh} mesh
     */
    constructor(mesh) {
        super();
        this.mesh = mesh;
    }

    update() {
        const transform = this.node.getComponentOfType(Transform);

        let y = 0;
        for (let i = 0; i < this.mesh.indices.length; i++) {
            const startI = i - (i % 3);
            y = this.interpolateY(
                transform.translation,
                this.mesh.vertices[this.mesh.indices[startI]].position,
                this.mesh.vertices[this.mesh.indices[startI + 1]].position,
                this.mesh.vertices[this.mesh.indices[startI + 2]].position,
            );
            if (y !== null) {
                break;
            }
        }

        // TODO: Implement offset using nested nodes
        transform.translation[1] = y + 2;
    }

    /**
     * Interpolates y coordinate between 3 vertices
     * @param {number[3]} p
     * @param {number[3]} v1
     * @param {number[3]} v2
     * @param {number[3]} v3
     * @returns {number|null} Interpolated Y or null if point is outside the triangle
     */
    interpolateY(p, v1, v2, v3) {
        const w1 =
            ((v2[2] - v3[2]) * (p[0] - v3[0]) +
                (v3[0] - v2[0]) * (p[2] - v3[2])) /
            ((v2[2] - v3[2]) * (v1[0] - v3[0]) +
                (v3[0] - v2[0]) * (v1[2] - v3[2]));
        const w2 =
            ((v3[2] - v1[2]) * (p[0] - v3[0]) +
                (v1[0] - v3[0]) * (p[2] - v3[2])) /
            ((v2[2] - v3[2]) * (v1[0] - v3[0]) +
                (v3[0] - v2[0]) * (v1[2] - v3[2]));
        const w3 =
            ((v1[2] - v2[2]) * (p[0] - v1[0]) +
                (v2[0] - v1[0]) * (p[2] - v1[2])) /
            ((v2[2] - v3[2]) * (v1[0] - v3[0]) +
                (v3[0] - v2[0]) * (v1[2] - v3[2]));

        if (w1 < 0 || w2 < 0 || w3 < 0) {
            return null;
        }

        return v1[1] * w1 + v2[1] * w2 + v3[1] * w3;
    }
}
