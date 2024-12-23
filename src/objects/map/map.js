import { GLTFLoader } from '../../engine/loaders/GLTFLoader.js';
import { Node } from '../../engine/core/Node.js';
import { getGlobalModelMatrix } from '../../engine/core/SceneUtils.js';
import { mat4 } from 'gl-matrix';

const loader = new GLTFLoader();
await loader.load(new URL('./model/map.gltf', import.meta.url));

export default class Map extends Node {
    constructor() {
        super('map');

        this.addChild(loader.loadScene(loader.defaultScene));

        const water = this.getChildByName('water');
        const translation = [0, 0, 0];
        console.log(
            mat4.getTranslation(
                translation,
                getGlobalModelMatrix(water).multiply(
                    mat4.fromTranslation(mat4.create(), [0, 2, 0]),
                ),
            ),
        );
    }
}
