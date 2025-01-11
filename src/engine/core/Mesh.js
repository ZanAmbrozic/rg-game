export class Mesh {
    /**
     * @param {Vertex[]} vertices
     * @param {number[][]} indices
     */
    constructor({ vertices = [], indices = [] } = {}) {
        this.vertices = vertices;
        this.indices = indices;
    }
}
