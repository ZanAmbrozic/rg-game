export class Node {
    /**
     * @param {string?} name
     */
    constructor(name) {
        /** @type {Node|null} */
        this.parent = null;
        /** @type {Node[]} */
        this.children = [];
        /** @type {Component[]} */
        this.components = [];
        this.name = name;
        /** @type {Record<any>} */
        this.customProperties = {};
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

    /**
     * Gets a child by its name
     * @param {string} name
     * @returns {Node |null}
     */
    getChildByName(name) {
        return this.find(
            (child) => child.name === name || child.name === `${name}_Baked`,
        );
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
     * @template T
     * @param {type} type
     * @returns {T[]}
     */
    getComponentsOfType(type) {
        return this.components.filter((component) => component instanceof type);
    }
}
