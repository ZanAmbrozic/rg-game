import fishData from './objects/fish/fishData.js';
import rodsData from './objects/rods/rodsData.js';

const menu = document.querySelector('.menu');
const start = document.querySelector('#start');
const tutorialButton = document.querySelector('#tutorial-button');
const tutorialPopUp = document.querySelector('#tutorial-pop-up');
const closeTutorial = document.querySelector('#close-tutorial');

const fishtionary = document.querySelector('.fish-collection');
const closeFishtionary = document.querySelector('#close-fishtionary');

const shop = document.querySelector('.shop');
const closeShop = document.querySelector('#close-shop');
const money = document.querySelector('#money');
const rodSlots = document.querySelectorAll('.rodSlot');

let cash = 0;

export function updateFishtionary() {
    const slots = document.querySelectorAll('.slot');
    slots.forEach((slot, index) => {
        slot.innerHTML = '';
        if (index < fishData.length) {
            const fish = fishData[index];

            switch (fish.biome) {
                case 'sea':
                    slot.style.backgroundColor = 'lightgreen';
                    break;
                case 'lake':
                    slot.style.backgroundColor = 'lightblue';
                    break;
                case 'river':
                    slot.style.backgroundColor = 'white';
                    break;
                default:
                    slot.style.backgroundColor = 'grey';
                    break;
            }

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

export function updateShop() {
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

export function initHUD() {
    start.addEventListener('click', () => {
        menu.style.display = 'none';
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
            e.key === 'k' &&
            menu.style.display === 'none' &&
            fishtionary.style.display === 'none' &&
            shop.style.display === 'none'
        ) {
            updateFishtionary();
            fishtionary.style.display = 'block';
        } else if (e.key === 'k') {
            fishtionary.style.display = 'none';
        }
    });

    closeFishtionary.addEventListener('click', () => {
        fishtionary.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (
            e.key === 'l' &&
            menu.style.display === 'none' &&
            shop.style.display === 'none' &&
            fishtionary.style.display === 'none'
        ) {
            updateShop();
            shop.style.display = 'block';
        } else if (e.key === 'l') {
            shop.style.display = 'none';
        }
    });

    closeShop.addEventListener('click', () => {
        shop.style.display = 'none';
    });

    rodSlots.forEach((slot) => {
        slot.addEventListener('click', () => {
            const rodId = slot.id;
            const rod = rodsData.find(r => r.name.toLowerCase() === rodId.toLowerCase());

            if (!rod.bought && cash >= rod.price) {
                addMoney(-rod.price);
                rod.bought = true;
                updateShop();
                alert("Bought " + rodId + " rod!");
            } else if (!rod.bought && cash < rod.price) {
                alert("Not enough Cash!");
            } else if (rod && rod.bought) {
                alert("Already bought!");
            }
        });
    });
};
    
export function addMoney(amount) {
    cash += amount;
    money.textContent = `${cash} C`; // Update the money displayed in the HUD
}