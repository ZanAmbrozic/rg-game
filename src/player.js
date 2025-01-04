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

const loader = new GLTFLoader();
await loader.load(new URL('./models/rod/model.gltf', import.meta.url));

export default class Player extends Node {
    /**
     * @param {Map} map
     */
    constructor(map) {
        super();

        this.float = null;

        this.addComponent(
            new Transform({
                translation: [-10, 0, 0],
            }),
        );
        this.addComponent(new Camera({ fovy: 1.4 }));
        this.addComponent(new FirstPersonController(this, canvas));

        /** @type {Transform} */
        this.playerTransform = this.getComponentOfType(Transform);
        this.fpController = this.getComponentOfType(FirstPersonController);

        const mapModel = map.getChildByName('ground').getComponentOfType(Model);
        this.addComponent(new HorizontalMeshCollision(mapModel, 2));

        const rod = loader.loadScene(loader.defaultScene);
        rod.addComponent(
            new Transform({
                translation: [0.5, -0.3, -0.5],
                scale: [0.08, 0.08, 0.08],
                rotation: [-0.5, -0.2, 0, 1],
            }),
        );
        rod.addComponent(new HUD());
        this.addChild(rod);

        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
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

            const catchType = throwComponent.fishCheck({ fishChance: 0.8 });

            if (catchType === 'fish') {
                const fish = throwComponent.getFishType();
                console.log(fish.name);
            } else if (catchType === 'trash') {
                console.log('trash');
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
