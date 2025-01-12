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

const walkSound1 = new Audio('src/sound/ambience/walking1.mp3');
const walkSound2 = new Audio('src/sound/ambience/walking2.mp3');

const walkLeft = document.querySelector('.cat-mode-walk1');
const walkRight = document.querySelector('.cat-mode-walk2');
const standing = document.querySelector('.cat-mode-img');
walkSound1.load();
walkSound1.volume = 0.06;
walkSound2.load();
walkSound2.volume = 0.06;

// TODO: MAKE MODEL FETCHING ONLY HAPPEN ONCE!!!
// to reduce lag caused by multiple fetches, pawprint only spawns one at a time
const loader = new GLTFLoader();
await loader.load(new URL('./model/model.gltf', import.meta.url));

function changeCatImage(newImage) {
    switch (newImage) {
        case 'basePose':
            standing.style.display = 'block';
            walkLeft.style.display = 'none';
            walkRight.style.display = 'none';
            break;
        case 'walk1':
            standing.style.display = 'none';
            walkLeft.style.display = 'block';
            walkRight.style.display = 'none';
            break;
        case 'walk2':
            standing.style.display = 'none';
            walkLeft.style.display = 'none';
            walkRight.style.display = 'block';
            break;
        default:
            standing.style.display = 'block';
            walkLeft.style.display = 'none';
            walkRight.style.display = 'none';
            break;
    }

}

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
            const fpController = this.node.getComponentOfType(
                FirstPersonController,
            );
            const yaw = fpController.yaw;
            const translation = vec3.create();

            if (
                fpController.velocity.filter((e) => Math.abs(e) >= 0.1)
                    .length === 0
            ) {
                changeCatImage("basePose")
                return;
            }

            vec3.add(
                translation,
                transform.translation,
                vec3.fromValues(
                    0.2 *
                        (this.isLeft
                            ? Math.sin(yaw + Math.PI / 2)
                            : Math.sin(yaw - Math.PI / 2)),
                    -this.yOffset,
                    0.2 *
                        (this.isLeft
                            ? Math.cos(yaw + Math.PI / 2)
                            : Math.cos(yaw - Math.PI / 2)),
                ),
            );
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
            if (this.isLeft) {
                walkSound1.play();
                changeCatImage("walk1");
            }
            else {
                walkSound2.play();
                changeCatImage("walk2");
            }

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

        this.addChild(loader.loadNode(0, false));
        this.addComponent(new PawprintController());
    }
}

export class PawprintController extends Component {
    constructor() {
        super();

        this.alpha = 1;
        this.lifetime = 3;
        this.startTime = null;
    }

    update(t, dt) {
        if (this.startTime === null) {
            this.startTime = t;

            const color = [51, 20, 6];

            this.node
                .getChildByName('path1')
                .getComponentOfType(Model)
                ?.primitives.forEach((e) => {
                    e.material.baseFactor = [
                        color[0] / 255,
                        color[1] / 255,
                        color[2] / 255,
                        1,
                    ];
                });
        }

        if (t > this.startTime + this.lifetime) {
            scene.removeChild(this.node);
        }
    }
}
