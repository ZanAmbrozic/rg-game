import { Component } from './Component.js';

export class Light extends Component {
    constructor({ color = [1, 1, 1], intensity = 1 }) {
        super();

        this.color = color;
        this.intensity = intensity;
    }
}
