import { GUI } from './lib/dat.js';
import { ResizeSystem } from './engine/systems/ResizeSystem.js';
import { UpdateSystem } from './engine/systems/UpdateSystem.js';
import { FirstPersonController } from './engine/controllers/FirstPersonController.js';
import { Camera, Node } from './engine/core.js';
import Player from './player.js';
import Map from './objects/map/map.js';
import { LitRenderer } from './engine/renderers/LitRenderer.js';
import { ImageLoader } from './engine/loaders/ImageLoader.js';
import { Light } from './engine/core/Light.js';

const menu = document.querySelector('.menu');
const start = document.querySelector('#start');
const tutorialButton = document.querySelector('#tutorial-button');
const tutorialPopUp = document.querySelector('#tutorial-pop-up');
const closeTutorial = document.querySelector('#close-tutorial');
const fullscreen = document.querySelector('.fullscreen');

const money = document.querySelector('#money');
let cash = 0;

function addMoney(added) {
    cash += added;
    money.textContent = `${cash} C`;
}

const fishtionary = document.querySelector('.fish-collection');
const closeFishtionary = document.querySelector('#close-fishtionary');

const shop = document.querySelector('.shop');
const closeShop = document.querySelector('#close-shop');

start.addEventListener('click', () => {
    menu.style.display = 'none';
    fullscreen.style.display = 'block';
    money.style.display = 'block';
});

tutorialButton.addEventListener('click', () => {
    tutorialPopUp.style.display = 'block';
});

closeTutorial.addEventListener('click', () => {
    tutorialPopUp.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (
        e.key == 'k' &&
        fullscreen.style.display == 'block' &&
        fishtionary.style.display == 'none'
    ) {
        updateFishtionary();
        fishtionary.style.display = 'block';
    } else if (e.key == 'k') {
        fishtionary.style.display = 'none';
    }
});

closeFishtionary.addEventListener('click', () => {
    fishtionary.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (
        e.key == 'l' &&
        fullscreen.style.display === 'block' &&
        shop.style.display == 'none'
    ) {
        updateShop();
        shop.style.display = 'block';
    } else if (e.key == 'l') {
        shop.style.display = 'none';
    }
});

closeShop.addEventListener('click', () => {
    shop.style.display = 'none';
});

import fishData from './objects/fish/fishData.js';

function updateFishtionary() {
    const slots = document.querySelectorAll('.slot');
    slots.forEach((slot, index) => {
        slot.innerHTML = '';
        if (index < fishData.length) {
            const fish = fishData[index];
            if (fish.caught && fish.type == 'fish') {
                const img = document.createElement('img');
                img.classList.add('fish-pic');
                img.src = 'src/objects/fish/blankFish.png';
                slot.appendChild(img);

                const fishName = document.createElement('span');
                fishName.textContent = fish.name;
                slot.appendChild(fishName);
            } else {
                const img = document.createElement('img');
                img.classList.add('fish-pic');
                img.src = 'src/objects/fish/blankFish.png';
                slot.appendChild(img);

                const unknown = document.createElement('span');
                unknown.textContent = '?';
                slot.appendChild(unknown);
            }
        }
    });
}

import rodsData from './objects/rods/rodsData.js';
import Physics from './physics.js';
function updateShop() {
    const rodSlots = document.querySelectorAll('.rodSlot');
    rodSlots.forEach((slot, index) => {
        slot.innerHTML = '';
        const rod = rodsData[index];
        if (!rod.bought) {
            const rodName = document.createElement('span');
            const price = document.createElement('span');

            rodName.textContent = rod.name;
            price.textContent = rod.price + ' C';

            slot.appendChild(rodName);
            slot.appendChild(document.createElement('br'));
            slot.appendChild(price);
        } else {
            const rodName = document.createElement('span');

            rodName.textContent = 'BOUGHT!';

            slot.appendChild(rodName);
        }
    });
}

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

const light = new Node();
light.addComponent(
    new Light({
        direction: [-0.5, -1.0, -0.5],
        color: [255, 255, 255],
        intensity: 2,
    }),
);
scene.addChild(light);

// const physics = new Physics();

function update(t, dt) {
    scene.traverse((node) => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });

    // physics.update();
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
