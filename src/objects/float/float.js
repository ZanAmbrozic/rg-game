import { Node } from '../../engine/core/Node.js';
import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Transform } from '../../engine/core/Transform.js';
import { Component } from '../../engine/core/Component.js';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { scene } from '../../main.js';
import { Model } from '../../engine/core/Model.js';
import { interpolateY } from '../../engine/core/MeshUtils.js';
import { getGlobalModelMatrix } from '../../engine/core/SceneUtils.js';

const loader = new GLTFLoader();
await loader.load(new URL('./model/float.gltf', import.meta.url));

export default class Float extends Node {
    constructor(translation, yaw) {
        super();

        this.addComponent(
            new Transform({
                translation: mat3.clone(translation),
                scale: [0.1, 0.1, 0.1],
            }),
        );
        this.addChild(loader.loadScene(loader.defaultScene));

        this.addComponent(new Throw(yaw));
    }
}

class Throw extends Component {
    constructor(yaw) {
        super();

        const throwMult = 10;

        this.velocity = [
            Math.sin(yaw - Math.PI) * throwMult,
            0,
            Math.cos(yaw - Math.PI) * throwMult,
        ];
        this.inWater = false;
        this.waterY = null;
    }

    // TODO: move to utils
    /**
     * @param {Node} node
     * @param {number[3]} point
     */
    isColliding(node, point) {
        /** @type {Model} */
        const model = node.getComponentOfType(Model);
        const globalMatrix = getGlobalModelMatrix(node);

        if (!model) {
            return false;
        }

        const mesh = model.primitives[0].mesh;

        for (let i = 0; i < mesh.indices.length; i += 3) {
            const positions = mesh.indices
                .slice(i, i + 3)
                .map((i) =>
                    mat4.getTranslation(
                        mat4.create(),
                        mat4
                            .fromTranslation(
                                mat4.create(),
                                mesh.vertices[i[0]].position,
                            )
                            .multiply(globalMatrix),
                    ),
                );

            const y = interpolateY(
                point,
                positions[0],
                positions[1],
                positions[2],
            );
            if (y !== null && point[1] < y) {
                return true;
            }
        }
        return false;
    }

    update(t, dt) {
        const transform = this.node.getComponentOfType(Transform);

        if (this.inWater) {
            transform.translation[1] =
                this.waterY - Math.sin(((t / 2) % 1) * 2 * Math.PI) * 0.05;

            return;
        }

        // gravity
        vec3.add(this.velocity, this.velocity, [0, -0.05, 0]);

        // drag
        vec3.scale(this.velocity, this.velocity, 0.999);

        vec3.scaleAndAdd(
            transform.translation,
            transform.translation,
            this.velocity,
            dt,
        );

        // TODO: maybe get all water objects by component instead of name
        const water = scene.getChildByName('sea');

        if (this.isColliding(water, transform.translation)) {
            this.velocity = [0, 0, 0];

            this.waterY = transform.translation[1];
            this.inWater = true;
            return;
        }

        if (
            scene
                .getChildByName('map')
                .find((node) => this.isColliding(node, transform.translation))
        ) {
            scene.removeChild(this.node);
        }
    }
}
