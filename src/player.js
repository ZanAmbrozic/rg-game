import { Node } from './engine/core/Node.js';
import { Camera } from './engine/core/Camera.js';
import { Transform } from './engine/core/Transform.js';
import { FirstPersonController } from './engine/controllers/FirstPersonController.js';
import { HorizontalMeshCollision } from './engine/physics/HorizontalMeshCollision.js';
import { GLTFLoader } from './engine/loaders/GLTFLoader.js';
import { canvas, debug, scene } from './main.js';
import Float from './objects/float/float.js';

const loader = new GLTFLoader();
await loader.load(new URL('./models/rod/model.gltf', import.meta.url));

export default class Player extends Node {
    /**
     * @param {Mesh} collisionMesh
     */
    constructor(collisionMesh) {
        super();

        this.float = null;

        this.addComponent(
            new Transform({
                translation: [-10, 0, 0],
            }),
        );
        this.addComponent(new Camera({ fovy: 1.4 }));
        this.addComponent(new FirstPersonController(this, canvas));
        this.addComponent(new HorizontalMeshCollision(collisionMesh, 2));

        const rod = loader.loadScene(loader.defaultScene);
        rod.addComponent(
            new Transform({
                translation: [0.5, -0.3, -0.5],
                scale: [0.08, 0.08, 0.08],
                rotation: [-0.5, -0.2, 0, 1],
            }),
        );
        this.addChild(rod);

        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    }

    handleMouseDown() {
        if (this.float !== null) {
            scene.removeChild(this.float);
        }

        /** @type {Transform} */
        const playerTransform = this.getComponentOfType(Transform);

        this.float = new Float(
            playerTransform.translation,
            playerTransform.rotation,
        );
        scene.addChild(this.float);
    }
}
