import { loadResources } from './engine/loaders/resources.js';

export default await loadResources({
    map: new URL('./models/map/model.obj', import.meta.url),
    mapTexture: new URL('./models/map/texture.png', import.meta.url),
});
