import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Node } from '../../engine/core/Node.js';

const loader = new GLTFLoader();
await loader.load(new URL('./model/map.gltf', import.meta.url));

export default class Map extends Node {
    constructor() {
        super('map');

        this.addChild(loader.loadScene(loader.defaultScene));
    }
}
