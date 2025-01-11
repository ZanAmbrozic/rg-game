import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Component } from '../../engine/core/Component.js';
import { Transform } from '../../engine/core/Transform.js';
import { vec3 } from 'gl-matrix';
import { Node } from '../../engine/core/Node.js';

const playerColliderLoader = new GLTFLoader();
await playerColliderLoader.load(
    new URL('./model/player.gltf', import.meta.url),
);

export class PlayerCollider extends Node {
    /**
     * @param {Player} player
     */
    constructor(player) {
        super();

        this.customProperties.collider = true;
        this.addComponent(playerColliderLoader.loadMesh(0));
        this.addComponent(new Transform({ scale: [0.05, 0.05, 0.05] }));
        this.addComponent(new PlayerColliderController(player));
    }
}

class PlayerColliderController extends Component {
    /**
     * @param {Player} player
     */
    constructor(player) {
        super();
        this.player = player;
    }

    update() {
        /** @type {Transform} */
        const transform = this.node.getComponentOfType(Transform);
        /** @type {Transform} */
        const playerTransform = this.player.getComponentOfType(Transform);

        transform.translation = vec3.clone(playerTransform.translation);
        transform.translation[1] -= 0.1;
    }
}
