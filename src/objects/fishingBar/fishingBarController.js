import { Component } from '../../engine/core/Component.js';
import { quat } from 'gl-matrix';
import { Transform } from '../../engine/core/Transform.js';

export class FishingBarController extends Component {
    constructor() {
        super();

        this.progressBar = document.getElementById('progress-bar');
        this.progressBarContainer =
            document.getElementById('progress-container');

        this.progressBarContainer.style.display = 'block';
        this.progress = 0;
        this.up = true;
    }

    resetAndHide() {
        this.progressBarContainer.style.display = 'none';
        this.up = true;
        return this.progress;
    }

    set_progress(num) {
        this.progressBar.value = num;
    }

    update(t, dt) {
        const progressScalar = 100;

        this.progress += (this.up ? 1 : -1) * dt * 100;

        if (this.progress >= 100) {
            this.progress = 100;
            this.up = false;
        }
        if (this.progress <= 0) {
            this.progress = 0;
            this.up = true;
        }

        const rodTransform = this.node
            .getChildByName('rod')
            .getComponentOfType(Transform);
        const newRot = quat.create();
        quat.rotateX(newRot, rodTransform.rotation, (Math.PI / 4) * dt * -10);

        rodTransform.rotation = newRot;
        this.set_progress(this.progress);
    }
}
