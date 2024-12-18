export class Sampler {
    /**
     * @param {('nearest'|'linear')} minFilter
     * @param magFilter
     * @param mipmapFilter
     * @param addressModeU
     * @param addressModeV
     * @param addressModeW
     * @param maxAnisotropy
     */
    constructor({
        minFilter = 'linear',
        magFilter = 'linear',
        mipmapFilter = 'linear',
        addressModeU = 'clamp-to-edge',
        addressModeV = 'clamp-to-edge',
        addressModeW = 'clamp-to-edge',
        maxAnisotropy = 1,
    } = {}) {
        this.minFilter = minFilter;
        this.magFilter = magFilter;
        this.mipmapFilter = mipmapFilter;
        this.addressModeU = addressModeU;
        this.addressModeV = addressModeV;
        this.addressModeW = addressModeW;
        this.maxAnisotropy = maxAnisotropy;
    }
}
