export class Material {
    /**
     * @param {boolean} unlit
     * @param {Texture} baseTexture
     * @param {Texture} emissionTexture
     * @param {Texture} normalTexture
     * @param {Texture} occlusionTexture
     * @param {Texture} roughnessTexture
     * @param {Texture} metalnessTexture
     * @param {number[4]} baseFactor
     * @param {number[3]} emissionFactor
     * @param {number} normalFactor
     * @param {number} occlusionFactor
     * @param {number} roughnessFactor
     * @param {number} metalnessFactor
     */
    constructor({
        unlit = false,

        baseTexture,
        emissionTexture,
        normalTexture,
        occlusionTexture,
        roughnessTexture,
        metalnessTexture,

        baseFactor = [1, 1, 1, 1],
        emissionFactor = [0, 0, 0],
        normalFactor = 1,
        occlusionFactor = 1,
        roughnessFactor = 1,
        metalnessFactor = 1,
    } = {}) {
        this.unlit = unlit;

        this.baseTexture = baseTexture;
        this.emissionTexture = emissionTexture;
        this.normalTexture = normalTexture;
        this.occlusionTexture = occlusionTexture;
        this.roughnessTexture = roughnessTexture;
        this.metalnessTexture = metalnessTexture;

        this.baseFactor = baseFactor;
        this.emissionFactor = emissionFactor;
        this.normalFactor = normalFactor;
        this.occlusionFactor = occlusionFactor;
        this.roughnessFactor = roughnessFactor;
        this.metalnessFactor = metalnessFactor;
    }
}
