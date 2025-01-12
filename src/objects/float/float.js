import { Node } from '../../engine/core/Node.js';
import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Transform } from '../../engine/core/Transform.js';
import { Component } from '../../engine/core/Component.js';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { debug, scene } from '../../main.js';
import { Model } from '../../engine/core/Model.js';
import { interpolateY } from '../../engine/core/MeshUtils.js';
import { getGlobalModelMatrix } from '../../engine/core/SceneUtils.js';
import fishData from '../fish/fishData.js';
import { FirstPersonController } from '../../engine/controllers/FirstPersonController.js';

const hitWater = new Audio('src/sound/fishing/dropIn.mp3');
const fishBite = new Audio('src/sound/fishing/fishBite.mp3');
hitWater.load();
hitWater.volume = 0.3;
fishBite.load();
fishBite.volume = 0.5;

const loader = new GLTFLoader();
await loader.load(new URL('./model/float.gltf', import.meta.url));

const fishWarningLoader = new GLTFLoader();
await fishWarningLoader.load(
    new URL('../fishWarning/model.gltf', import.meta.url),
);

export default class Float extends Node {
    constructor(translation, yaw, pitch, multiplier, parent) {
        super();

        this.addComponent(
            new Transform({
                translation: mat3.clone(translation),
                scale: [0.1, 0.1, 0.1],
            }),
        );
        this.addChild(loader.loadScene(loader.defaultScene));
        this.addComponent(new Throw(yaw, pitch, multiplier));

        // this.parent = parent;
        // this.parentFPController = parent.getComponentOfType(
        //     FirstPersonController,
        // );
    }
}

export class FishWarning extends Node {
    constructor() {
        super();

        this.transform = new Transform({
            translation: [0, 10, 0],
        });

        this.addComponent(this.transform);

        fishBite.play();
        this.addChild(
            fishWarningLoader.loadScene(fishWarningLoader.defaultScene),
        );
    }
}

export class Throw extends Component {
    constructor(yaw, pitch, multiplier) {
        super();

        const throwMult = 10 + multiplier;

        this.velocity = [
            Math.sin(yaw - Math.PI) * throwMult,
            Math.sin(pitch) * throwMult,
            Math.cos(yaw - Math.PI) * throwMult,
        ];
        this.waterY = null;
        this.timeToFish = null;
        this.timeToEscape = null;
        this.fishWarning = null;
        this.biome = null;
        this.bonusChance = 2 ** Math.round(multiplier) / 2 ** 10 / 10;
        this.state = 'throwing'; // either throwing, water, reeling or deleted
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

    // used to update properties for them to indicate that a fish is on the line
    catchFish(t, dt) {
        if (this.state !== 'water') {
            return;
        }

        this.timeToFish = null;
        this.timeToEscape = t + (Math.random() * (3 - 1) + 1); // Min/Max time for a fish to escape

        this.fishWarning = new FishWarning();
        this.node.addChild(this.fishWarning);
    }

    reelFish(t, dt) {
        return;
    }

    fishCheck(rod) {
        if (this.timeToFish === null && this.timeToEscape !== null) {
            const r = Math.random();
            return r < rod.fishChance + this.bonusChance ? 'fish' : 'trash';
        }
        return null;
    }

    getFishType() {
        const eligibleFish = fishData.filter(
            (fish) => fish.biome === this.biome || fish.biome === 'global',
        );

        const raritySum = eligibleFish.reduce(
            (n, { rarityLevel }) => n + rarityLevel,
            0,
        );

        const r = Math.round(Math.random() * raritySum);

        let sum = 0;
        for (const fish of eligibleFish) {
            sum += fish.rarityLevel;
            if (sum >= r) {
                return fish;
            }
        }
    }

    update(t, dt) {
        /*if (
            this.state === 'water' ||
            this.state === 'reeling' ||
            this.state === 'throwing'
        ) {
            this.node.parentFPController.isActive = false;
        }*/

        if (this.state === 'reeling') {
            return;
        }

        const transform = this.node.getComponentOfType(Transform);

        if (this.state === 'water') {
            transform.translation[1] =
                this.waterY - Math.sin(((t / 2) % 1) * 2 * Math.PI) * 0.05;

            // fish is not on the line
            if (this.timeToFish === null && this.timeToEscape === null) {
                this.timeToFish = t + (Math.random() * (7 - 2) + 2); // Min/Max time to catch a fish

                if (this.fishWarning != null) {
                    this.node.removeChild(this.fishWarning);
                    this.fishWarning = null;
                }
                debug.textContent = '';
            }

            // fish is on the line
            else if (this.timeToFish !== null && t >= this.timeToFish) {
                this.catchFish(t, dt);
            }

            // fish is going to escape
            else if (this.timeToEscape !== null && t >= this.timeToEscape) {
                this.timeToEscape = null;
            }
            return;
        }

        // resets time to catch a fish
        this.timeToFish = null;
        this.timeToEscape = null;

        // gravity
        const speedScalar = 300; // bigger ==> smaller throw distance
        let increase = [0, 0, 0];
        vec3.scale(increase, [0, -0.05, 0], dt * speedScalar);
        vec3.add(this.velocity, this.velocity, increase);
        vec3.add(this.velocity, this.velocity, [0, -0.05, 0]);

        // drag
        vec3.scale(this.velocity, this.velocity, 0.999);

        vec3.scaleAndAdd(
            transform.translation,
            transform.translation,
            this.velocity,
            dt,
        );

        const bodiesOfWater = scene.filter(
            (node) => !!node.customProperties?.is_water,
        );

        for (const water of bodiesOfWater) {
            if (this.isColliding(water, transform.translation)) {
                this.velocity = [0, 0, 0];

                hitWater.play();
                this.waterY = transform.translation[1];
                this.state = 'water';
                this.biome = water.name;
                return;
            }
        }

        if (
            scene
                .getChildByName('ground')
                .find((node) => this.isColliding(node, transform.translation))
        ) {
            this.state = 'deleted';
            //this.node.parentFPController.isActive = true;
            scene.removeChild(this.node);
        }
    }
}
