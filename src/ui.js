import fishData from './objects/fish/fishData.js';
import rodsData from './objects/rods/rodsData.js';
import { player } from './main.js';

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

const itemBoughtSound = new Audio('src/sound/shop/itemBought.wav');
const swapRodSound = new Audio('src/sound/shop/swapRod.mp3');
const backgroundSound = new Audio('src/sound/ambience/backgroundWind.mp3');

itemBoughtSound.load();
itemBoughtSound.volume = 0.3;
swapRodSound.load();
swapRodSound.volume = 0.6;
backgroundSound.load();
backgroundSound.volume = 0.4

let cash = 20000;
let catMode = false;

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
        backgroundSound.play();
        backgroundSound.loop = true;
    });

    tutorialButton.addEventListener('click', () => {
        tutorialPopUp.style.display = 'block';
    });

    closeTutorial.addEventListener('click', () => {
        tutorialPopUp.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (menu.style.display !== 'none') return;

        if (e.key === 'k') {
            if (fishtionary.style.display === 'none') {
                updateFishtionary();
                fishtionary.style.display = 'block';
                shop.style.display = 'none';
            } else {
                fishtionary.style.display = 'none';
            }
        }

        if (e.key === 'l') {
            if (shop.style.display === 'none') {
                updateShop();
                shop.style.display = 'block';
                fishtionary.style.display = 'none';
            } else {
                shop.style.display = 'none';
            }
        }

        if (e.key === 'c') {
            toggleCatMode();
        }
    });

    closeFishtionary.addEventListener('click', () => {
        fishtionary.style.display = 'none';
    });

    closeShop.addEventListener('click', () => {
        shop.style.display = 'none';
    });

    rodSlots.forEach((slot) => {
        slot.addEventListener('click', () => {
            const rodId = slot.id;
            const rod = rodsData.find(r => r.name.toLowerCase() === rodId.toLowerCase());

            if (!rod.bought && cash >= rod.price ) {
                spendMoney(rod.price);
                rod.bought = true;
                updateShop();
                itemBoughtSound.play();
                player.setRod(rod.name);
                makeMessage("Bought " + rodId + " rod!");
            } else if (!rod.bought && cash < rod.price) {
                makeMessage("Not enough Cash!");
            } else if (rod && rod.bought) {
                player.setRod(rod.name);
                swapRodSound.play();
                makeMessage("Switched rod to " + rodId + "!");
            }
        });
    });
};
    
export function makeMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.textContent = text;
    
    document.body.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

export function addMoney(amount) {
    cash += amount;
    money.textContent = `${cash} C`;

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('moneyAdded');
    msgDiv.textContent = "+" + amount + " C";
    
    document.body.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

function spendMoney(amount) {
    cash -= amount;

    money.textContent = `${cash} C`;

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('moneySpent');
    msgDiv.textContent = "-" + amount + " C";
    
    document.body.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

function toggleCatMode() {
    const catModeContainer = document.querySelector('.cat-mode-container');
    catMode = !catMode;

    if(catMode) {
        catModeContainer.style.display = 'flex';
        makeMessage("Cat mode...?")
    } else {
        catModeContainer.style.display = 'none';
        makeMessage("Cat mode... :(")
    }
}