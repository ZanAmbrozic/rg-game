import { Component } from './Component.js';

export class Light extends Component {
    constructor({
        direction = [0, 0, 0],
        color = [255, 255, 255],
        intensity = 1,
    }) {
        super();

        this.direction = direction;
        this.color = color;
        this.intensity = intensity;
    }
}
