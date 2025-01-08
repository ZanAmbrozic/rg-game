import { GUI } from './lib/dat.js';
import { ResizeSystem } from './engine/systems/ResizeSystem.js';
import { UpdateSystem } from './engine/systems/UpdateSystem.js';
import { FirstPersonController } from './engine/controllers/FirstPersonController.js';
import { Camera, Node } from './engine/core.js';
import Player from './player.js';
import Map from './objects/map/map.js';
import { LitRenderer } from './engine/renderers/LitRenderer.js';
import { ImageLoader } from './engine/loaders/ImageLoader.js';
import { initHUD } from './ui.js';
import Physics from './physics.js';

initHUD();

export const debug = document.querySelector('#debug');

export const canvas = document.querySelector('canvas');
const renderer = new LitRenderer(canvas);
await renderer.initialize();

const imageLoader = new ImageLoader();
const environmentImages = await Promise.all(
    ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'].map((url) =>
        imageLoader.load(new URL(`objects/skybox/${url}`, import.meta.url)),
    ),
);
renderer.setEnvironment(environmentImages);

export const scene = new Node();

const map = new Map();
scene.addChild(map);

const player = new Player(map);
scene.addChild(player);

console.log('scene:', scene);

const physics = new Physics();

function update(t, dt) {
    scene.traverse((node) => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });

    physics.update();
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
