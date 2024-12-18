export class Texture {
    /**
     * @param {ImageBitmap} image
     * @param {Sampler} sampler
     * @param {boolean} isSRGB
     */
    constructor({ image, sampler, isSRGB = false } = {}) {
        this.image = image;
        this.sampler = sampler;
        this.isSRGB = isSRGB;
    }

    get width() {
        return this.image.width;
    }

    get height() {
        return this.image.height;
    }
}
