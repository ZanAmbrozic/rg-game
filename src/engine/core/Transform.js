import { mat4, vec3 } from 'gl-matrix';
import { Component } from './Component.js';
import { getGlobalModelMatrix } from './SceneUtils.js';

export class Transform extends Component {
    constructor({
        rotation = [0, 0, 0, 1],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        matrix,
    } = {}) {
        super();
        this.rotation = rotation;
        this.translation = translation;
        this.scale = scale;
        if (matrix) {
            this.matrix = matrix;
        }
    }

    /** @type {import('gl-matrix').mat4} */
    get matrix() {
        return mat4.fromRotationTranslationScale(
            mat4.create(),
            this.rotation,
            this.translation,
            this.scale,
        );
    }

    set matrix(matrix) {
        mat4.getRotation(this.rotation, matrix);
        mat4.getTranslation(this.translation, matrix);
        mat4.getScaling(this.scale, matrix);
    }

    get global() {
        return getGlobalModelMatrix(this.node);
    }

    get globalTranslation() {
        return mat4.getTranslation(vec3.create(), this.global);
    }
}
