import { Node } from './engine/core/Node.js';
import { Camera } from './engine/core/Camera.js';
import { Transform } from './engine/core/Transform.js';
import { FirstPersonController } from './engine/controllers/FirstPersonController.js';
import { HorizontalMeshCollision } from './engine/physics/HorizontalMeshCollision.js';
import { GLTFLoader } from './engine/loaders/GLTFLoader.js';
import { canvas, debug, scene } from './main.js';
import Float, { Throw } from './objects/float/float.js';
import { mat3 } from 'gl-matrix';
import { Model } from './engine/core/Model.js';
import { HUD } from './engine/core/HUD.js';
import { addMoney } from './ui.js';
import RigidBody from './engine/physics/RigidBody.js';
import { makeMessage } from './ui.js';
import rodsData from './objects/rods/rodsData.js';
import { Trailmaker } from './objects/pawprint/pawprint.js';

const loader = new GLTFLoader();

export default class Player extends Node {
    /**
     * @param {Map} map
     */
    constructor(map) {
        super();

        this.rodModels = new Map();
        this.currentRod = null;
        this.currentRodChance = null;

        this.float = null;

        this.addComponent(
            new Transform({
                translation: [-10, 0, 0],
            }),
        );
        this.addComponent(new Camera({ fovy: 1.4 }));
        this.addComponent(new FirstPersonController(this, canvas));
        this.addComponent(new RigidBody({ dynamic: true }));

        /** @type {Transform} */
        this.playerTransform = this.getComponentOfType(Transform);
        this.fpController = this.getComponentOfType(FirstPersonController);

        const mapModel = map.getChildByName('ground').getComponentOfType(Model);
        this.addComponent(new HorizontalMeshCollision(mapModel, 2));
        this.addComponent(new Trailmaker(mapModel, 1.95));

        this.loadRodModels().then(() => {
            this.setRod('Stick');
        });

        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    }

    async loadRodModels() {
        for (const rod of rodsData) {
            const model = await loader.load(
                new URL(rod.modelPath, import.meta.url),
            );
            const rodNode = model.loadScene(loader.defaultScene);
            rodNode.addComponent(
                new Transform({
                    translation: [0.6, -0.3, -0.5],
                    scale: [0.04, 0.04, 0.04],
                    rotation: [-0.5, -0.3, -0.1, 1],
                }),
            );

            this.rodModels.set(rod.name, rodNode);
        }
    }

    setRod(rodName) {
        if (this.currentRod) {
            this.removeChild(this.currentRod);
        }

        const newRod = this.rodModels.get(rodName);
        if (newRod) {
            this.currentRod = newRod;
            this.addChild(newRod);

            this.currentRodData = rodsData.find((rod) => rod.name === rodName);
        }
    }
    handleMouseDown() {
        if (
            this.float === null ||
            this.float.getComponentOfType(Throw).state === 'deleted'
        ) {
            this.float = null;
        }

        if (this.float !== null) {
            const throwComponent = this.float.getComponentOfType(Throw);
            const catchType = throwComponent.fishCheck({
                fishChance: this.currentRodData?.fishChance,
            });

            if (catchType === 'fish') {
                const fish = throwComponent.getFishType();
                fish.caught = true;
                console.log(fish.name);

                makeMessage('You caught a ' + fish.name + '!');
                addMoney(fish.sellPrice);
            } else if (catchType === 'trash') {
                makeMessage(
                    'You caught trash, thanks for helping the environment!',
                );
                addMoney(0);
            } else {
                console.log('not fishable');
            }

            throwComponent.state = 'reeling';

            scene.removeChild(this.float);
            this.float = null;
            debug.textContent = '';

            //this.fpController.isActive = true;
            return;
        }

        const floatTransform = mat3.clone(this.playerTransform.translation);
        floatTransform[1] += 0.2;

        this.float = new Float(
            floatTransform,
            this.fpController.yaw,
            this.fpController.pitch,
            this,
        );
        scene.addChild(this.float);
    }
}
