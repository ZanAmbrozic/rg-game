type GLTFSpec = {
    scene: number;
    scenes: GLTFScene[];
    nodes: GLTFNode[];
    cameras: GLTFCamera[];
    materials: GLTFMaterial[];
    meshes: GLTFMesh[];
    textures: GLTFTexture[];
    images: GLTFImage[];
    accessors: GLTFAccessor[];
    bufferViews: GLTFBufferView[];
    samplers: GLTFSampler[];
    buffers: GLTFBuffer[];
    extensionsUsed: string[];
    extensions: {
        KHR_lights_punctual?: {
            lights: GLTFKHRLightPunctual[];
        };
    };
};

type GLTFScene = {
    name: string;
    nodes: number[];
};

type GLTFNode = {
    name: string;
    mesh?: number;
    translation?: number[];
    scale?: number[];
    rotation?: number[];
    extras?: Object;
    children?: GLTFNode[];
    camera: GLTFCamera;
    extensions?: {
        KHR_lights_punctual?: {
            light: number;
        };
    };
};

type GLTFCamera = {
    type: 'perspective' | 'orthographic';
    perspective?: {
        aspectRatio: number;
        yfov: number;
        znear: number;
        zfar: number;
    };
    orthographic?: {
        xmag: number;
        ymag: number;
        znear: number;
        zfar: number;
    };
};

type GLTFMaterial = {
    name: string;
    doubleSided: boolean;
    pbrMetallicRoughness: GLTFPBRMetallicRoughness;
    normalTexture: {
        index: number;
        scale: number;
    };
    emissiveTexture: {
        index: number;
        scale: number;
    };
    occlusionTexture: {
        index: number;
        scale: number;
        strength: number;
    };
    emissiveFactor: number;
    extensions?: Object;
};

type GLTFPBRMetallicRoughness = {
    baseColorFactor: number[];
    baseColorTexture: {
        index: number;
    };
    metallicFactor: number;
    roughnessFactor: number;
    metallicRoughnessTexture: {
        index: number;
    };
};

type GLTFMesh = {
    name: string;
    primitives: GLTFPrimitive[];
};

type GLTFPrimitive = {
    attributes: Record<string, number[]>;
    indices: number;
    material: number;
    mode?: number;
};

type GLTFTexture = {
    sampler: number;
    source: number;
};

type GLTFImage = {
    mimeType: string;
    name: string;
    uri: string;
};

type GLTFAccessor = {
    bufferView: number;
    byteOffset: number;
    componentType: number;
    count: number;
    max: number[];
    min: number[];
    type: string;
    normalized: boolean;
};

type GLTFBufferView = {
    buffer: number;
    byteLength: number;
    byteOffset: number;
    target: number;
    byteStride: number;
};

type GLTFSampler = {
    magFilter?: number;
    minFilter?: number;
    wrapS?: number;
    wrapT?: number;
};

type GLTFBuffer = {
    byteLength: number;
    uri: string;
};

type GLTFKHRLightPunctual = {
    name: string;
    type: 'directional';
    color: number[];
    intensity: number;
};
