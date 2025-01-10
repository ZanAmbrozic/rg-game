import { Node } from '../../engine/core/Node.js';
import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Transform } from '../../engine/core/Transform.js';
import { Component } from '../../engine/core/Component.js';
import { mat3, mat4, quat, vec3 } from 'gl-matrix';
import { debug, scene } from '../../main.js';
import { Model } from '../../engine/core/Model.js';
import { interpolateY } from '../../engine/core/MeshUtils.js';
import { getGlobalModelMatrix } from '../../engine/core/SceneUtils.js';
import fishData from '../fish/fishData.js';
import { FirstPersonController } from '../../engine/controllers/FirstPersonController.js';

// TODO: MAKE MODEL FETCHING ONLY HAPPEN ONCE!!!
// to reduce lag caused by multiple fetches, pawprint only spawns one at a time
const loader = new GLTFLoader();
await loader.load(new URL('./model/model.gltf', import.meta.url));

export class Trailmaker extends Component {
    constructor(model, yOffset) {
        super();

        this.yOffset = yOffset;
        this.nextPrint = null;
        this.isLeft = true;
        this.spawnRate = 0.2; // in seconds

        this.mesh = model.primitives[0].mesh;
    }

    update(t, dt) {
        if (this.nextPrint === null || this.nextPrint < t) {
            const transform = this.node.getComponentOfType(Transform);
            const translation = vec3.create();
            vec3.add(
                translation,
                transform.translation,
                vec3.fromValues(this.isLeft ? -0.2 : 0.2, -this.yOffset, 0),
            );

            const yaw = this.node.getComponentOfType(FirstPersonController).yaw;
            const rotation = quat.create();
            quat.fromEuler(rotation, 0, (yaw * 180) / Math.PI, 0);

            let y = 0;
            let ind1 = null;
            let ind2 = null;
            let ind3 = null;
            for (let i = 0; i < this.mesh.indices.length; i += 3) {
                ind1 = this.mesh.vertices[this.mesh.indices[i]].position;
                ind2 = this.mesh.vertices[this.mesh.indices[i + 1]].position;
                ind3 = this.mesh.vertices[this.mesh.indices[i + 2]].position;
                y = this.interpolateY(translation, ind1, ind2, ind3);
                if (y !== null) {
                    break;
                }
            }

            if (y === null) {
                return;
            }

            const P1 = vec3.fromValues(...ind1);
            const P2 = vec3.fromValues(...ind2);
            const P3 = vec3.fromValues(...ind3);

            const objectOrientation = vec3.fromValues(0, 1, 0);

            const v1 = vec3.create();
            const v2 = vec3.create();

            vec3.sub(v1, P2, P1);
            vec3.sub(v2, P3, P1);

            const cross = vec3.create();
            vec3.cross(cross, v1, v2);

            const normal = vec3.create();
            vec3.normalize(normal, cross);

            const objectOrientationUnit = vec3.create();
            vec3.normalize(objectOrientationUnit, objectOrientation);

            const rotationAxis = vec3.normalize(
                vec3.create(),
                vec3.cross(vec3.create(), objectOrientationUnit, normal),
            );

            const angle = Math.acos(vec3.dot(objectOrientationUnit, normal));

            const planeRotation = quat.create();
            quat.setAxisAngle(planeRotation, rotationAxis, angle);

            const p = new Pawprint(
                translation,
                quat.rotateY(quat.create(), planeRotation, yaw), // applies left/right rotation
            );

            scene.addChild(p);

            this.nextPrint = t + this.spawnRate;
            this.isLeft = !this.isLeft;
        }
    }

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

export class Pawprint extends Node {
    constructor(translation, rotation) {
        super();

        this.addComponent(
            new Transform({
                translation: vec3.clone(translation),
                scale: [0.05, 0.05, 0.05],
                rotation: vec3.clone(rotation),
            }),
        );
        // loader
        //     .load(new URL('./model/model.gltf', import.meta.url))
        //     .then((GLTFLoader) =>
        //         this.addChild(GLTFLoader.loadScene(GLTFLoader.defaultScene)),
        //     );
        this.addChild(loader.loadScene(loader.defaultScene));

        this.addComponent(new PawprintController());
    }
}

export class PawprintController extends Component {
    constructor() {
        super();

        this.alpha = 1;
        this.lifetime = 3;
        this.startTime = null;
        //console.log(this);
    }

    update(t, dt) {
        if (this.startTime === null) {
            this.startTime = t;
        }

        // this.node
        //     .getComponentOfType(Model)
        //     ?.primitives.forEach((e) => (e.material.baseFactor[3] = 0));

        if (t > this.startTime + this.lifetime) {
            scene.removeChild(this.node);
        }
    }
}
