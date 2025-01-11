import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Node } from '../../engine/core/Node.js';
import { Model } from '../../engine/core/Model.js';
import RigidBody from '../../engine/physics/RigidBody.js';

const loader = new GLTFLoader();
await loader.load(new URL('./model/map.gltf', import.meta.url));

export default class Map extends Node {
    constructor() {
        super('map');

        loader
            .loadNode('lake')
            .getComponentOfType(Model).primitives[0].material.unlit = true;
        loader
            .loadNode('ground')
            .getComponentOfType(Model).primitives[0].material.unlit = true;
        loader
            .loadNode('sea')
            .getComponentOfType(Model).primitives[0].material.unlit = true;
        loader
            .loadNode('tree')
            .getComponentOfType(Model)
            .primitives.forEach((p) => {
                p.material.unlit = true;
                p.material.baseTexture.sampler.minFilter = 'nearest';
            });

        loader.loadNode('tree').addComponent(new RigidBody());

        loader.loadScene(loader.defaultScene).traverse((node) => {
            if (!!node.customProperties.rigid_body) {
                node.addComponent(new RigidBody());
            }
        });

        this.addChild(loader.loadScene(loader.defaultScene));
    }
}
