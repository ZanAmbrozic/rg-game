import { GUI } from './lib/dat.js';
import { ResizeSystem } from './engine/systems/ResizeSystem.js';
import { UpdateSystem } from './engine/systems/UpdateSystem.js';
import { FirstPersonController } from './engine/controllers/FirstPersonController.js';
import { Camera, Node } from './engine/core.js';
import Player from './player.js';
import Map from './objects/map/map.js';
import resources from './resources.js';
import { LitRenderer } from './engine/renderers/LitRenderer.js';
import { ImageLoader } from './engine/loaders/ImageLoader.js';

export const debug = document.querySelector('#debug');

export const canvas = document.querySelector('canvas');
const renderer = new LitRenderer(canvas);
await renderer.initialize();

const imageLoader = new ImageLoader();
const environmentImages = await Promise.all(
    ['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp'].map(
        (url) =>
            imageLoader.load(new URL(`objects/skybox/${url}`, import.meta.url)),
    ),
);
renderer.setEnvironment(environmentImages);

export const scene = new Node();

const player = new Player(resources.map);
scene.addChild(player);

scene.addChild(new Map());

function update(t, dt) {
    scene.traverse((node) => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });
}

function render() {
    renderer.render(scene, player);
}

function resize({ displaySize: { width, height } }) {
    player.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
const controller = player.getComponentOfType(FirstPersonController);
gui.add(controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(controller, 'maxSpeed', 0, 10);
gui.add(controller, 'decay', 0, 1);
gui.add(controller, 'acceleration', 1, 100);
