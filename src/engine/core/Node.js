export class Node {
    constructor() {
        /** @type {Node|null} */
        this.parent = null;
        /** @type {Node[]} */
        this.children = [];
        /** @type {Component[]} */
        this.components = [];
    }

    /**
     * @param {Node} node
     */
    addChild(node) {
        node.parent?.removeChild(node);
        this.children.push(node);
        node.parent = this;
    }

    /**
     * @param {Node} node
     */
    removeChild(node) {
        this.children = this.children.filter((child) => child !== node);
        node.parent = null;
    }

    remove() {
        this.parent?.removeChild(this);
    }

    traverse(before, after) {
        before?.(this);
        for (const child of this.children) {
            child.traverse(before, after);
        }
        after?.(this);
    }

    linearize() {
        const array = [];
        this.traverse((node) => array.push(node));
        return array;
    }

    filter(predicate) {
        return this.linearize().filter(predicate);
    }

    find(predicate) {
        return this.linearize().find(predicate);
    }

    map(transform) {
        return this.linearize().map(transform);
    }

    /**
     * @param {Component} component
     */
    addComponent(component) {
        component.node = this;
        this.components.push(component);
    }

    /**
     * @param {Component} component
     */
    removeComponent(component) {
        this.components = this.components.filter((c) => c !== component);
    }

    /**
     * @param {type} type
     */
    removeComponentsOfType(type) {
        this.components = this.components.filter(
            (component) => !(component instanceof type),
        );
    }

    /**
     * @template T
     * @param {type} type
     * @returns {T}
     */
    getComponentOfType(type) {
        return this.components.find((component) => component instanceof type);
    }

    /**
     * @param {type} type
     * @returns {Component[]}
     */
    getComponentsOfType(type) {
        return this.components.filter((component) => component instanceof type);
    }
}
