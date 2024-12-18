export class Primitive {
    /**
     * @param {Mesh} mesh
     * @param {Material} material
     */
    constructor({ mesh, material } = {}) {
        this.mesh = mesh;
        this.material = material;
    }
}
