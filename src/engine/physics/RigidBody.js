import { Component } from '../core/Component.js';

export default class RigidBody extends Component {
    constructor({ dynamic = false } = {}) {
        super();

        this.dynamic = dynamic;
    }
}
