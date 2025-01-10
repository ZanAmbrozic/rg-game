const rodsData = [
    {
        name: 'Basic',
        fishChance: 0.75,
        modelPath: './models/rod/model.gltf',
        price: 2000,
        bought: false,
    },
    {
        name: 'Upgraded',
        fishChance: 0.89,
        modelPath: './models/rod/model.gltf',
        price: 6000,
        bought: false,
    },
    {
        name: 'Max',
        fishChance: 0.99,
        modelPath: './models/rod/model.gltf',
        price: 10000,
        bought: false,
    },

    // default rod
    {
        name: 'Stick',
        fishChance: 0.65,
        modelPath: './models/rod/starterRodv3.gltf',
        price: 0,
        bought: true,
    },
]

export default rodsData;