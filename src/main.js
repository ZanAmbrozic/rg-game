import { GUI } from './lib/dat.js';
import { mat4 } from 'glm';

import { ResizeSystem } from './engine/systems/ResizeSystem.js';
import { UpdateSystem } from './engine/systems/UpdateSystem.js';
import { UnlitRenderer } from './engine/renderers/UnlitRenderer.js';
import { FirstPersonController } from './engine/controllers/FirstPersonController.js';

import {
    Camera,
    Material,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from './engine/core.js';

import { loadResources } from './engine/loaders/resources.js';

const resources = await loadResources({
    mesh: new URL('./models/floor.json', import.meta.url),
    image: new URL('./models/grass.png', import.meta.url),
    map: new URL('./models/map/model.obj', import.meta.url),
    mapTexture: new URL('./models/map/texture.png', import.meta.url),
    rod: new URL('./models/rod/model.obj', import.meta.url),
});

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const scene = new Node();

const camera = new Node();
camera.addComponent(
    new Transform({
        translation: [0, 1, 0],
    }),
);
camera.addComponent(new Camera());
camera.addComponent(new FirstPersonController(camera, canvas));

function distance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[2] - pos2[2], 2),
    );
}

/** @type {Mesh} */
const mapMesh = resources.map;

function getClosestVertices(pos) {
    const closest = [];
    for (let i = 0; i < 3; i++) {
        let minDist = null;
        let minIndex = null;
        for (const vertex of mapMesh.vertices) {
            if (closest.includes(mapMesh.vertices.indexOf(vertex))) {
                continue;
            }
            const dist = distance(pos, vertex.position);
            if (minDist === null) {
                minDist = dist;
                minIndex = mapMesh.vertices.indexOf(vertex);
                continue;
            }
            if (dist < minDist) {
                minDist = dist;
                minIndex = mapMesh.vertices.indexOf(vertex);
            }
        }
        closest.push(minIndex);
    }
    return closest.map((i) => mapMesh.vertices[i].position);
}

camera.addComponent({
    update() {
        const transform = camera.getComponentOfType(Transform);

        const v = getClosestVertices(transform.translation);

        console.log(v);

        // transform.translation[1] = minVertex[1] + 2;
    },
});

scene.addChild(camera);

const rod = new Node();
rod.addComponent(
    new Transform({
        translation: [0.5, -0.3, -0.5],
        scale: [0.1, 0.1, 0.1],
        rotation: [0.2, 0, 0, 1],
    }),
);
rod.addComponent(
    new Model({
        primitives: [
            new Primitive({
                mesh: resources.rod,
                material: new Material({
                    baseTexture: new Texture({
                        image: resources.image,
                        sampler: new Sampler({
                            minFilter: 'nearest',
                            magFilter: 'nearest',
                            addressModeU: 'repeat',
                            addressModeV: 'repeat',
                        }),
                    }),
                }),
            }),
        ],
    }),
);
camera.addChild(rod);

const map = new Node();
// map.addComponent(
//     new Transform({
//         scale: [2, 2, 2],
//     }),
// );
map.addComponent(
    new Model({
        primitives: [
            new Primitive({
                mesh: resources.map,
                material: new Material({
                    baseTexture: new Texture({
                        image: resources.mapTexture,
                        sampler: new Sampler({
                            minFilter: 'nearest',
                            magFilter: 'nearest',
                            addressModeU: 'repeat',
                            addressModeV: 'repeat',
                        }),
                    }),
                }),
            }),
        ],
    }),
);
scene.addChild(map);

function update(t, dt) {
    scene.traverse((node) => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height } }) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
const controller = camera.getComponentOfType(FirstPersonController);
gui.add(controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(controller, 'maxSpeed', 0, 10);
gui.add(controller, 'decay', 0, 1);
gui.add(controller, 'acceleration', 1, 100);
