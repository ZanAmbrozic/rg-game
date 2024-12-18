import { Component } from './Component.js';

export class Model extends Component {
    /**
     * @param {Primitive[]} primitives
     */
    constructor({ primitives = [] } = {}) {
        super();
        this.primitives = primitives;
    }
}
