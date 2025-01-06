import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Node } from '../../engine/core/Node.js';
import RigidBody from '../../engine/physics/RigidBody.js';
import { Model } from '../../engine/core/Model.js';

const loader = new GLTFLoader();
await loader.load(new URL('./model/map.gltf', import.meta.url));

export default class Map extends Node {
    constructor() {
        super('map');

        const cube = loader.loadNode('Cube');
        cube.addComponent(new RigidBody());

        loader
            .loadNode('lake')
            .getComponentOfType(Model).primitives[0].material.unlit = true;
        loader
            .loadNode('ground')
            .getComponentOfType(Model).primitives[0].material.unlit = true;
        loader
            .loadNode('sea')
            .getComponentOfType(Model).primitives[0].material.unlit = true;

        this.addChild(loader.loadScene(loader.defaultScene));
    }
}
